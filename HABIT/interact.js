document.addEventListener('DOMContentLoaded', () => {
    const habitForm = document.getElementById('habit-form');
    const habitNameInput = document.getElementById('habit-name');
    const habitFrequencySelect = document.getElementById('habit-frequency');
    const habitsList = document.getElementById('habits');

    // Статистика
    const totalHabitsSpan = document.getElementById('total-habits');
    const completedTodaySpan = document.getElementById('completed-today');
    const overallCompletionSpan = document.getElementById('overall-completion');

    // Ключ для localStorage
    const LOCAL_STORAGE_KEY = 'habitTracker.habits';
    const LOCAL_STORAGE_STATS_KEY = 'habitTracker.stats';

    let habits = [];
    let stats = {
        completedToday: 0,
        totalHabits: 0,
        // Можно добавить более сложную статистику, например, по дням/неделям
    };

    // --- Функции для работы с localStorage ---

    const saveHabits = () => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(habits));
    };

    const loadHabits = () => {
        const storedHabits = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedHabits) {
            habits = JSON.parse(storedHabits);
        }
    };

    const saveStats = () => {
        localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(stats));
    };

    const loadStats = () => {
        const storedStats = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
        if (storedStats) {
            stats = JSON.parse(storedStats);
            // Проверка на сброс статистики "сегодня" при новой загрузке
            // (Простая логика, можно улучшить, проверяя дату)
            const today = new Date().toDateString();
            if (!stats.lastUpdated || new Date(stats.lastUpdated).toDateString() !== today) {
                stats.completedToday = 0;
                stats.lastUpdated = today;
            }
        } else {
            // Инициализация статистики, если нет данных
            stats = {
                completedToday: 0,
                totalHabits: 0,
                lastUpdated: new Date().toDateString()
            };
        }
    };

    // --- Функции для отображения ---

    const renderHabits = () => {
        habitsList.innerHTML = ''; // Очищаем текущий список
        habits.forEach((habit, index) => {
            const li = document.createElement('li');
            li.classList.add('habit-item');
            li.dataset.id = habit.id; // Уникальный ID для работы с элементом

            const isDoneToday = habit.doneDates && habit.doneDates.includes(new Date().toDateString());

            li.innerHTML = `
                <div class="habit-info">
                    <h3>${habit.name}</h3>
                    <span class="frequency">${habit.frequency}</span>
                </div>
                <div class="habit-actions">
                    <button class="mark-done ${isDoneToday ? 'done' : ''}">
                        ${isDoneToday ? 'Выполнено' : 'Отметить'}
                    </button>
                    <span class="streak">Серия: ${habit.streak || 0} дней</span>
                </div>
                <button class="delete-habit">Удалить</button>
            `;
            habitsList.appendChild(li);
        });
        updateStats();
    };

    const updateStats = () => {
        totalHabitsSpan.textContent = stats.totalHabits;
        completedTodaySpan.textContent = stats.completedToday;

        let overallCompletion = 0;
        if (stats.totalHabits > 0) {
            // Простая формула, можно усложнить (например, учитывать частоту)
            overallCompletion = Math.round((stats.completedToday / stats.totalHabits) * 100);
        }
        overallCompletionSpan.textContent = `${overallCompletion}%`;
    };

    // --- Обработчики событий ---

    habitForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Предотвращаем стандартное поведение формы (перезагрузку страницы)

        const name = habitNameInput.value.trim();
        const frequency = habitFrequencySelect.value;

        if (name) {
            const newHabit = {
                id: Date.now().toString(), // Простой уникальный ID
                name: name,
                frequency: frequency,
                streak: 0, // Начальная серия
                doneDates: [] // Массив дат, когда привычка была выполнена
            };
            habits.push(newHabit);
            stats.totalHabits++; // Увеличиваем общее количество привычек
            saveHabits();
            renderHabits();
            habitNameInput.value = ''; // Очищаем поле ввода
            habitNameInput.focus(); // Возвращаем фокус на поле ввода
        }
    });

    habitsList.addEventListener('click', (e) => {
        const target = e.target;
        const habitItem = target.closest('.habit-item'); // Находим родительский <li>
        if (!habitItem) return; // Если клик не по элементу привычки, ничего не делаем

        const habitId = habitItem.dataset.id;
        const habit = habits.find(h => h.id === habitId); // Находим привычку по ID

        if (!habit) return; // Если привычка не найдена (маловероятно, но для безопасности)

        // --- Обработка кнопки "Выполнено" ---
        if (target.classList.contains('mark-done')) {
            const todayString = new Date().toDateString();
            const isAlreadyDoneToday = habit.doneDates.includes(todayString);

            if (!isAlreadyDoneToday) {
                habit.doneDates.push(todayString);
                habit.streak = (habit.streak || 0) + 1; // Увеличиваем серию
                stats.completedToday++; // Увеличиваем счетчик выполненных сегодня
                // Можно добавить логику сброса серии, если привычка не выполнена в какой-то день
            } else {
                // Если уже выполнено сегодня, ничего не делаем или можно добавить отмену
                // habit.doneDates = habit.doneDates.filter(date => date !== todayString); // Отмена выполнения
                // habit.streak = Math.max(0, habit.streak - 1); // Снижаем серию
                // stats.completedToday--;
            }
            saveHabits();
            saveStats();
            renderHabits(); // Перерисовываем, чтобы обновить состояние кнопки и серии
        }

        // --- Обработка кнопки "Удалить" ---
        if (target.classList.contains('delete-habit')) {
            if (confirm(`Вы уверены, что хотите удалить привычку "${habit.name}"?`)) {
                habits = habits.filter(h => h.id !== habitId); // Удаляем из массива
                // Если привычка была выполнена сегодня, уменьшаем счетчик
                const todayString = new Date().toDateString();
                if (habit.doneDates.includes(todayString)) {
                    stats.completedToday--;
                }
                stats.totalHabits--; // Уменьшаем общее количество привычек
                saveHabits();
                saveStats();
                renderHabits();
            }
        }
    });

    // --- Инициализация ---

    loadStats(); // Загружаем статистику
    loadHabits(); // Загружаем привычки
    renderHabits(); // Отображаем привычки при загрузке страницы
});