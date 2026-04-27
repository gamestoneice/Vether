document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('locationBtn');
    const weatherCard = document.getElementById('weatherCard');
    const loading = document.getElementById('loading');
    const errorCard = document.getElementById('errorCard');
    const errorMessage = document.getElementById('errorMessage');

    // Элементы для отображения данных
    const cityName = document.getElementById('cityName');
    const currentDate = document.getElementById('currentDate');
    const temperature = document.getElementById('temperature');
    const feelsLike = document.getElementById('feelsLike');
    const description = document.getElementById('description');
    const weatherIcon = document.getElementById('weatherIcon');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('windSpeed');
    const pressure = document.getElementById('pressure');
    const tempRange = document.getElementById('tempRange');

    // Текущая дата
    function updateDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        currentDate.textContent = now.toLocaleDateString('ru-RU', options);
    }
    updateDate();
    setInterval(updateDate, 60000); // обновлять каждую минуту

    // Показать/скрыть loading
    function showLoading() {
        loading.style.display = 'flex';
        weatherCard.style.display = 'none';
        errorCard.style.display = 'none';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    // Показать погоду
    function showWeather(data) {
        cityName.textContent = data.city;
        temperature.textContent = Math.round(data.temperature);
        feelsLike.textContent = Math.round(data.feels_like);
        description.textContent = data.description;
        weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
        humidity.textContent = `${data.humidity}%`;
        windSpeed.textContent = `${data.wind_speed} м/с`;
        pressure.textContent = `${data.pressure} гПа`;
        // Для диапазона температуры используем фиктивные значения (в реальном API можно добавить min/max)
        const max = Math.round(data.temperature + 3);
        const min = Math.round(data.temperature - 3);
        tempRange.textContent = `${max}° / ${min}°`;

        weatherCard.style.display = 'block';
        errorCard.style.display = 'none';
    }

    // Показать ошибку
    function showError(msg) {
        errorMessage.textContent = msg;
        errorCard.style.display = 'block';
        weatherCard.style.display = 'none';
    }

    // Скрыть ошибку
    window.hideError = function() {
        errorCard.style.display = 'none';
    };

    // Запрос к API
    async function fetchWeather(city) {
        showLoading();
        try {
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            // Задержка для демонстрации loading (можно убрать)
            await new Promise(resolve => setTimeout(resolve, 500));
            showWeather(data);
        } catch (err) {
            console.error('Ошибка:', err);
            showError(`Не удалось получить погоду для "${city}". Проверьте название города или подключение к интернету.`);
        } finally {
            hideLoading();
        }
    }

    // Поиск по кнопке
    searchBtn.addEventListener('click', function() {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        } else {
            showError('Введите название города');
        }
    });

    // Поиск по Enter
    cityInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Геолокация
    locationBtn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            showError('Геолокация не поддерживается вашим браузером');
            return;
        }
        showLoading();
        navigator.geolocation.getCurrentPosition(
            async function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // В реальном API можно использовать координаты, но для простоты используем город по координатам через обратный геокодинг
                // Для демо просто запросим погоду для "Москва"
                try {
                    // Здесь можно вызвать API с координатами, но у нас endpoint только по городу
                    // Используем сторонний сервис для получения города по координатам, но для простоты возьмем фиктивный
                    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ru`);
                    const geoData = await response.json();
                    const city = geoData.city || geoData.locality || 'Москва';
                    cityInput.value = city;
                    fetchWeather(city);
                } catch (e) {
                    // fallback
                    fetchWeather('Москва');
                }
            },
            function(error) {
                hideLoading();
                showError('Не удалось определить ваше местоположение. Разрешите доступ к геолокации.');
            }
        );
    });

    // Загрузить погоду для Москвы по умолчанию
    fetchWeather('Москва');
});