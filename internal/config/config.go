package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	Port           string
	APIKey         string
	GuardianAPIKey string
	NYTAPIKey      string
	RedditClientID string
	RedditSecret   string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}
	// log.Println("DATABASE_URL =", os.Getenv("DATABASE_URL"))

	cfg := &Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		Port:           os.Getenv("PORT"),
		APIKey:         os.Getenv("API_KEY"),
		GuardianAPIKey: os.Getenv("GUARDIAN_API_KEY"),
		NYTAPIKey:      os.Getenv("NYT_API_KEY"),
		RedditClientID: os.Getenv("REDDIT_CLIENT_ID"),
		RedditSecret:   os.Getenv("REDDIT_SECRET"),
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if cfg.APIKey == "" {
		log.Fatal("API_KEY is required")
	}
	if cfg.Port == "" {
		cfg.Port = "8081"
	}

	return cfg
}
