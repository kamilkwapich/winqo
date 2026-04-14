from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "dev"
    database_url: str
    jwt_secret: str
    jwt_issuer: str = "window-quoter"
    jwt_audience: str = "window-quoter-users"
    web_base_url: str = "https://winqo.online"

    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    paypal_client_id: str | None = None
    paypal_client_secret: str | None = None
    paypal_webhook_id: str | None = None
    autopay_merchant_id: str | None = None
    autopay_api_key: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
