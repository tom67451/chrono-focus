let timer;
      let minutes = 25;
      let seconds = 0;
      let isPaused = true;
      let enteredTime = null;
      let isBreak = false;
      let timerFinished = false;
      let pomodoroTime;

      const btnStart = document.getElementById("start-button");
      const settingsOverlay = document.getElementById("settings-content");
      const btnOpenSettings = document.getElementById("open-settings");
      const pomodoroTimerPage = document.getElementById("pomodoro-timer-page");
      const volumeSlider = document.getElementById("volume-slider");
      const volumeValue = document.getElementById("volume-value");
      const musicSelect = document.getElementById("music-select");
      const btnOpenStats = document.getElementById("open-stats");
      const statsPage = document.getElementById("stats-container");
      const pomodoroTimerContainer = document.getElementById(
        "pomodoro-timer-container"
      );
      const btnOpenAchievements = document.getElementById("open-achievements");
      const achievementsContainer = document.getElementById(
        "achievements-container"
      );
      const taskList = document.getElementById("task-list");
      const completedTasks = document.getElementById("completed-tasks");
      const taskFormContainer = document.getElementById("task-form-container");
      const taskForm = document.getElementById("task-form");
      const addTaskBtn = document.getElementById("add-task-btn");
      const cancelTaskBtn = document.getElementById("cancel-task");

      const clickSound = new Audio("Sounds/switch.mp3");
      const tickingClock = new Audio("Sounds/ticking.mp3");
      const ringSound = new Audio("Sounds/ring.mp3");
      const backgroundMusic = new Audio();
      backgroundMusic.loop = true;

      function updateTimerDisplay() {
        document.getElementById("timer").textContent = formatTime(
          minutes,
          seconds
        );
      }

      function formatTime(mins, secs) {
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
          2,
          "0"
        )}`;
      }

      function requestPermission() {
        Notification.requestPermission();
      }

      function trackPomodoroTime() {
        let today = new Date().toLocaleDateString();
        let stats = JSON.parse(localStorage.getItem("pomodoroStats")) || {};
        let allTimePomodoros = JSON.parse(
          localStorage.getItem("allTimePomodoros")
        ) || { total: 0 };

        if (!stats[today]) {
          stats[today] = 0;
        }
        stats[today]++;
        allTimePomodoros.total++;

        localStorage.setItem(
          "allTimePomodoros",
          JSON.stringify(allTimePomodoros)
        );
        localStorage.setItem("pomodoroStats", JSON.stringify(stats));
        renderAchievements();
      }

      function displayStats() {
        let today = new Date().toLocaleDateString();
        let stats = JSON.parse(localStorage.getItem("pomodoroStats")) || {};
        let todaysPomodoros = stats[today] || 0;
        document.getElementById("todays-pomodoros").textContent =
          todaysPomodoros;
      }

      function renderPomodoroChart() {
        let stats = JSON.parse(localStorage.getItem("pomodoroStats")) || {};
        let dates = Object.keys(stats);
        let pomodoroCounts = dates.map((date) => stats[date]);
        let ctx = document.getElementById("pomodoroChart").getContext("2d");

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: dates,
            datasets: [
              {
                label: "Daily Pomodoros",
                data: pomodoroCounts,
                backgroundColor: "red",
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true },
            },
          },
        });
      }

      function renderAchievements() {
        let allTimePomodoros =
          JSON.parse(localStorage.getItem("allTimePomodoros"))?.total || 0;
        let today = new Date().toLocaleDateString();
        let stats = JSON.parse(localStorage.getItem("pomodoroStats")) || {};
        let todaysPomodoros = stats[today] || 0;

        const achievementsNumberOfPomodoros = [
          { id: "first-pomodoro", required: 1 },
          { id: "pomodoro-rookie", required: 5 },
          { id: "finding-focus", required: 10 },
          { id: "time-master", required: 25 },
          { id: "rhytm-on-focus", required: 50 },
          { id: "the-1%", required: 100 },
        ];
        const achievementsNumberOfPomodorosADay = [
          { id: "slow-as-zuzik", required: 3 },
          { id: "marathon-runner", required: 10 },
        ];

        achievementsNumberOfPomodoros.forEach((achievement) => {
          let element = document.getElementById(achievement.id);
          if (allTimePomodoros >= achievement.required) {
            element.classList.add("achievement-container-completed");
            element.classList.remove("locked");
          } else {
            element.classList.remove("achievement-container-completed");
            element.classList.add("locked");
          }
        });

        achievementsNumberOfPomodorosADay.forEach((achievement) => {
          let element = document.getElementById(achievement.id);
          if (todaysPomodoros >= achievement.required) {
            element.classList.add("achievement-container-completed");
            element.classList.remove("locked");
          } else {
            element.classList.remove("achievement-container-completed");
            element.classList.add("locked");
          }
        });

        // Special: Night Owl achievement
        let hours = new Date().getHours();
        if (hours >= 0 && hours < 5) {
          localStorage.setItem("nightOwlAchievement", "true");
        }
        let nightOwlAchievement = localStorage.getItem("nightOwlAchievement");
        let nightOwlElement = document.getElementById("night-owl");
        if (nightOwlAchievement === "true") {
          nightOwlElement.classList.add("achievement-container-completed");
          nightOwlElement.classList.remove("locked");
        } else {
          nightOwlElement.classList.remove("achievement-container-completed");
          nightOwlElement.classList.add("locked");
        }
      }

      function startTimer() {
        if (isPaused) return;
        timerFinished = false;
        clickSound.currentTime = 0;
        clickSound
          .play()
          .catch((error) => console.log("Audio play blocked", error));
        startTicking();
        clearInterval(timer);
        timer = setInterval(updateTimer, 1000);
      }

      function updateTimer() {
        updateTimerDisplay();
        if (minutes === 0 && seconds === 0) {
          if (!isBreak) {
            if (timerFinished) return;
            timerFinished = true;
            tickingClock.currentTime = 0;
            tickingClock.pause();
            clearInterval(timer);
            isPaused = true;
            setTimeout(() => {
              confetti();
            }, 100);
            setTimeout(() => {
              askForBreak();
            }, 500);
            setTimeout(() => {
              ringSound.currentTime = 0;
              ringSound
                .play()
                .catch((error) => console.log("Ring Sound Blocked", error));
              setTimeout(() => {
                ringSound.pause();
                ringSound.currentTime = 0;
              }, 2000);
            }, 700);
            setTimeout(() => {
              trackPomodoroTime();
              displayStats();
              renderPomodoroChart();
            }, 1000);
          } else {
            startPomodoro();
          }
        } else if (!isPaused) {
          if (seconds > 0) {
            seconds--;
          } else {
            seconds = 59;
            minutes--;
          }
        }
      }

      function askForBreak() {
        let modal = document.createElement("div");
        modal.classList.add("break-modal");
        modal.innerHTML = `
          <div class="break-modal-content">
            <h2>Time's Up! ⏳</h2>
            <p>Would you like to take a break or start another Pomodoro session?</p>
            <button class="break-btn" id="start-break-btn">Take a Break</button>
            <button class="pomodoro-btn" id="skip-break-btn">Skip Break</button>
          </div>
        `;
        document.body.appendChild(modal);
        document
          .getElementById("start-break-btn")
          .addEventListener("click", () => {
            document.body.removeChild(modal);
            startBreak();
          });
        document
          .getElementById("skip-break-btn")
          .addEventListener("click", () => {
            document.body.removeChild(modal);
            resetToPomodoro();
          });
      }

      function startBreak() {
        breakUI();
        isBreak = true;
        let numberOfBreaks = parseInt(localStorage.getItem("breakCount")) || 0;
        numberOfBreaks++;
        localStorage.setItem("breakCount", numberOfBreaks);
        let shortBreakTime =
          parseInt(localStorage.getItem("shortBreakTime")) || 5;
        let longBreakTime =
          parseInt(localStorage.getItem("longBreakTime")) || 15;
        if (numberOfBreaks >= 3) {
          minutes = longBreakTime;
          numberOfBreaks = 0;
        } else {
          minutes = shortBreakTime;
        }
        seconds = 0;
        isPaused = false;
        updateTimerDisplay();
        startTimer();
      }

      function startPomodoro() {
        resetToPomodoroUI();
        minutes = parseInt(localStorage.getItem("pomodoroTime")) || 25;
        seconds = 0;
        isPaused = false;
        updateTimerDisplay();
        startTimer();
      }

      function resetToPomodoro() {
        resetToPomodoroUI();
        minutes = parseInt(localStorage.getItem("pomodoroTime")) || 25;
        seconds = 0;
        isPaused = true;
        clearInterval(timer);
        updateTimerDisplay();
      }

      function togglePauseResume() {
        const pauseResumeButton = document.querySelector(
          ".control-buttons button:nth-child(1)"
        );
        isPaused = !isPaused;
        if (isPaused) {
          tickingClock.pause();
          tickingClock.currentTime = 0;
          clearInterval(timer);
          pauseResumeButton.textContent = "Start";
        } else {
          startTimer();
          tickingClock.play();
          pauseResumeButton.textContent = "Pause";
        }
      }

      function restartTimer() {
        tickingClock.pause();
        tickingClock.currentTime = 0;
        clearInterval(timer);
        minutes = isBreak
          ? document
              .querySelector(".pom-short-break-long-break.selected")
              .textContent.toLowerCase()
              .includes("short")
            ? parseInt(localStorage.getItem("shortBreakTime")) || 5
            : parseInt(localStorage.getItem("longBreakTime")) || 15
          : parseInt(localStorage.getItem("pomodoroTime")) || 25;
        seconds = 0;
        isPaused = true;
        updateTimerDisplay();
        document.querySelector(
          ".control-buttons button:nth-child(1)"
        ).textContent = "Start";
      }

      function chooseTime() {
        const newTime = prompt("Enter new time in minutes:");
        if (!isNaN(newTime) && newTime > 0) {
          enteredTime = parseInt(newTime, 10);
          minutes = enteredTime;
          seconds = 0;
          isPaused = false;
          updateTimerDisplay();
          document.querySelector(
            ".control-buttons button:nth-child(1)"
          ).textContent = "Pause";
          clearInterval(timer);
          startTimer();
        } else {
          alert("Invalid input. Please enter a number greater than 0.");
        }
      }

      function chooseDefaultTime(type) {
        const newTime = prompt("Enter new time in minutes:");
        if (!isNaN(newTime) && newTime > 0) {
          let timeValue = parseInt(newTime, 10);
          if (type === "Pomodoro") {
            localStorage.setItem("pomodoroTime", timeValue);
            document.getElementById(
              "pomodoro-time-display"
            ).textContent = `${timeValue} min`;
          } else if (type === "Short break") {
            localStorage.setItem("shortBreakTime", timeValue);
            document.getElementById(
              "short-break-time-display"
            ).textContent = `${timeValue} min`;
          } else if (type === "Long break") {
            localStorage.setItem("longBreakTime", timeValue);
            document.getElementById(
              "long-break-time-display"
            ).textContent = `${timeValue} min`;
          }
          seconds = 0;
          updateTimerDisplay();
          clearInterval(timer);
        } else {
          alert("Invalid input. Please enter a number greater than 0.");
        }
      }

      function playMusic() {
        let selectedMusic = document.getElementById("music-select").value;
        if (selectedMusic === "lo-fi") {
          backgroundMusic.src = "songs/lo-fi.mp3";
        } else if (selectedMusic === "the-best") {
          backgroundMusic.src = "songs/umbrella-bird.mp3";
        } else {
          backgroundMusic.pause();
          backgroundMusic.currentTime = 0;
          return;
        }
        backgroundMusic.volume = localStorage.getItem("volumeLevel") || 1;
        backgroundMusic.play();
      }

      document
        .querySelectorAll(".pom-short-break-long-break")
        .forEach((button) => {
          button.addEventListener("click", () => {
            document
              .querySelectorAll(".pom-short-break-long-break")
              .forEach((btn) => btn.classList.remove("selected"));
            button.classList.add("selected");

            let mode = button.textContent.toLowerCase();
            if (mode.includes("pom")) {
              isBreak = false;
              minutes = parseInt(localStorage.getItem("pomodoroTime")) || 25;
              resetToPomodoroUI();
            } else if (mode.includes("short")) {
              isBreak = true;
              minutes = parseInt(localStorage.getItem("shortBreakTime")) || 5;
              breakUI();
            } else if (mode.includes("long")) {
              isBreak = true;
              minutes = parseInt(localStorage.getItem("longBreakTime")) || 15;
              breakUI();
            }
            seconds = 0;
            updateTimerDisplay();

            pomodoroTimerContainer.classList.remove("hidden");
            statsPage.classList.add("hidden");
            achievementsContainer.classList.add("hidden");
          });
        });

      function resetToPomodoroUI() {
        document.body.style.backgroundColor = "#bb4e4b";
        document.querySelector(
          ".pomodoro-timer-container"
        ).style.backgroundColor = "#c97675";
        document.querySelector(".pomodoro-timer-heading").textContent =
          "Pomodoro Timer";
        document.querySelector(
          ".control-buttons button:nth-child(1)"
        ).textContent = "Start";
        isBreak = false;
      }

      function breakUI() {
        document.body.style.backgroundColor = "rgb(25, 20, 20)";
        document.querySelector(
          ".pomodoro-timer-container"
        ).style.backgroundColor = "grey";
        document.querySelector(".pomodoro-timer-heading").textContent =
          "Break Time!";
        isBreak = true;
      }

      function startTicking() {
        tickingClock.loop = true;
        tickingClock
          .play()
          .catch((error) => console.log("Audio play blocked", error));
      }

      const saveTasksToLocalStorage = (tasks) => {
        localStorage.setItem("tasks", JSON.stringify(tasks));
      };

      const getTasksFromLocalStorage = () => {
        return JSON.parse(localStorage.getItem("tasks")) || [];
      };

      const renderTasks = () => {
        taskList.innerHTML = "";
        completedTasks.innerHTML = "";
        const tasks = getTasksFromLocalStorage();
        tasks.forEach((task, index) => {
          const taskElement = document.createElement("div");
          taskElement.classList.add("task");
          taskElement.innerHTML = `
            <input type="checkbox" class="complete-checkbox" data-index="${index}">
            <span>${task.title}</span>
            <button class="delete-btn" data-index="${index}">✖</button>
          `;
          taskElement
            .querySelector(".complete-checkbox")
            .addEventListener("change", (e) => {
              if (e.target.checked) {
                moveTaskToCompleted(index);
              }
            });
          taskElement
            .querySelector(".delete-btn")
            .addEventListener("click", () => {
              deleteTask(index);
            });
          taskList.appendChild(taskElement);
        });
      };

      taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const taskTitle = document.getElementById("task-title").value;
        if (!taskTitle.trim()) {
          alert("Task title is required.");
          return;
        }
        const newTask = { title: taskTitle };
        const tasks = getTasksFromLocalStorage();
        tasks.push(newTask);
        saveTasksToLocalStorage(tasks);
        renderTasks();
        taskForm.reset();
        taskFormContainer.classList.add("hidden");
      });

      addTaskBtn.addEventListener("click", () => {
        taskFormContainer.classList.remove("hidden");
        document.getElementById("task-title").focus();
      });

      cancelTaskBtn.addEventListener("click", () => {
        taskFormContainer.classList.add("hidden");
      });

      const moveTaskToCompleted = (index) => {
        let tasks = getTasksFromLocalStorage();
        let completedTask = tasks.splice(index, 1)[0];
        saveTasksToLocalStorage(tasks);
        renderTasks();
        const completedTaskElement = document.createElement("div");
        completedTaskElement.classList.add("task", "completed-task");
        completedTaskElement.innerHTML = `
          <span>${completedTask.title}</span>
          <button class="delete-btn">🗑️</button>
        `;
        completedTaskElement
          .querySelector(".delete-btn")
          .addEventListener("click", () => {
            completedTasks.removeChild(completedTaskElement);
          });
        completedTasks.appendChild(completedTaskElement);
      };

      const deleteTask = (index) => {
        let tasks = getTasksFromLocalStorage();
        tasks.splice(index, 1);
        saveTasksToLocalStorage(tasks);
        renderTasks();
      };

      document.addEventListener("DOMContentLoaded", () => {
        if (Notification.permission !== "granted") {
          Notification.requestPermission();
        }

        let savedVolume = localStorage.getItem("volumeLevel");
        if (savedVolume) {
          volumeSlider.value = savedVolume;
          clickSound.volume = savedVolume;
          tickingClock.volume = savedVolume;
          volumeValue.textContent = `${Math.round(savedVolume * 100)}%`;
        }

        pomodoroTime = parseInt(localStorage.getItem("pomodoroTime")) || 25;
        let shortBreakTime =
          parseInt(localStorage.getItem("shortBreakTime")) || 5;
        let longBreakTime =
          parseInt(localStorage.getItem("longBreakTime")) || 15;
        minutes = pomodoroTime;
        seconds = 0;
        updateTimerDisplay();
        clickSound.load();
        tickingClock.load();

        displayStats();
        renderPomodoroChart();
        renderAchievements();
        renderTasks();
      });

      btnStart.addEventListener("click", () => {
        startTimer();
      });

      btnOpenSettings.addEventListener("click", () => {
        settingsOverlay.style.display = "flex";
      });

      settingsOverlay.addEventListener("click", (event) => {
        if (event.target === settingsOverlay) {
          settingsOverlay.style.display = "none";
        }
      });

      volumeSlider.addEventListener("input", () => {
        let volume = volumeSlider.value;
        clickSound.volume = volume;
        tickingClock.volume = volume;
        volumeValue.textContent = `${Math.round(volume * 100)}%`;
        localStorage.setItem("volumeLevel", volume);
      });

      musicSelect.addEventListener("change", () => {
        playMusic();
      });

      btnOpenStats.addEventListener("click", () => {
        pomodoroTimerContainer.classList.add("hidden");
        achievementsContainer.classList.add("hidden");
        statsPage.classList.remove("hidden");
      });

      btnOpenAchievements.addEventListener("click", () => {
        pomodoroTimerContainer.classList.add("hidden");
        statsPage.classList.add("hidden");
        achievementsContainer.classList.remove("hidden");
      });
