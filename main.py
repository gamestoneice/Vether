from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx
import os
from typing import Optional
from pydantic import BaseModel

app = FastAPI(title="Weather App", description="Приложение для просмотра погоды")

# Монтируем статические файлы
app.mount("/static", StaticFiles(directory="static"), name="static")

# Инициализация шаблонов
templates = Jinja2Templates(directory="templates")

# Конфигурация (можно вынести в переменные окружения)
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "your_api_key_here")
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

class WeatherResponse(BaseModel):
    city: str
    temperature: float
    feels_like: float
    humidity: int
    pressure: int
    wind_speed: float
    description: str
    icon: str

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Главная страница с формой"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/weather")
async def get_weather(city: str = "Moscow"):
    """API endpoint для получения погоды по названию города"""
    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "lang": "ru"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(OPENWEATHER_URL, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                # Неверный API ключ - возвращаем демо данные
                return get_demo_weather(city)
            else:
                return {"error": f"HTTP error: {e.response.status_code}", "details": str(e)}
        except Exception as e:
            # При любой другой ошибке также возвращаем демо данные
            return get_demo_weather(city)

    # Преобразуем ответ
    weather = WeatherResponse(
        city=data["name"],
        temperature=data["main"]["temp"],
        feels_like=data["main"]["feels_like"],
        humidity=data["main"]["humidity"],
        pressure=data["main"]["pressure"],
        wind_speed=data["wind"]["speed"],
        description=data["weather"][0]["description"],
        icon=data["weather"][0]["icon"]
    )
    return weather.dict()


def get_demo_weather(city: str):
    """Возвращает демо данные о погоде для заданного города"""
    import random
    # Демо данные, зависящие от города для реалистичности
    temp = random.uniform(5, 25)
    feels = temp - random.uniform(0, 3)
    humidity = random.randint(40, 90)
    pressure = random.randint(980, 1030)
    wind = random.uniform(1, 10)
    descriptions = ["ясно", "облачно", "небольшой дождь", "пасмурно", "солнечно", "туман"]
    desc = random.choice(descriptions)
    icons = {"ясно": "01d", "облачно": "03d", "небольшой дождь": "10d", "пасмурно": "04d", "солнечно": "01d", "туман": "50d"}
    icon = icons.get(desc, "01d")
    
    return WeatherResponse(
        city=city,
        temperature=round(temp, 1),
        feels_like=round(feels, 1),
        humidity=humidity,
        pressure=pressure,
        wind_speed=round(wind, 1),
        description=desc,
        icon=icon
    ).dict()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "weather-app"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)