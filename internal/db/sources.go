package db

import (
	"context"

	"github.com/NguyenIslandBoy/daily-news/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

func GetActiveSources(pool *pgxpool.Pool) ([]models.Source, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id, name, url, feed_url, type, category, active, last_scraped_at
		 FROM sources WHERE active = true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sources []models.Source
	for rows.Next() {
		var s models.Source
		err := rows.Scan(&s.ID, &s.Name, &s.URL, &s.FeedURL, &s.Type,
			&s.Category, &s.Active, &s.LastScrapedAt)
		if err != nil {
			return nil, err
		}
		sources = append(sources, s)
	}
	return sources, rows.Err()
}

func UpdateLastScraped(pool *pgxpool.Pool, sourceID int) error {
	_, err := pool.Exec(context.Background(),
		`UPDATE sources SET last_scraped_at = now() WHERE id = $1`, sourceID)
	return err
}
