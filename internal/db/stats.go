package db

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func GetStats(pool *pgxpool.Pool) (map[string]any, error) {
	// Total count
	var total int
	if err := pool.QueryRow(context.Background(),
		`SELECT count(*) FROM articles`).Scan(&total); err != nil {
		return nil, err
	}

	// By category
	rows, err := pool.Query(context.Background(), `
		SELECT COALESCE(category, 'uncategorized'), count(*)
		FROM articles
		GROUP BY category`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	byCategory := map[string]int{}
	for rows.Next() {
		var cat string
		var count int
		if err := rows.Scan(&cat, &count); err != nil {
			return nil, err
		}
		byCategory[cat] = count
	}
	rows.Close()

	// By day — last 30 days
	rows2, err := pool.Query(context.Background(), `
		SELECT date_trunc('day', published_at)::date, count(*)
		FROM articles
		WHERE published_at > now() - interval '30 days'
		GROUP BY 1
		ORDER BY 1`)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	byDay := map[string]int{}
	for rows2.Next() {
		var day time.Time
		var count int
		if err := rows2.Scan(&day, &count); err != nil {
			return nil, err
		}
		byDay[day.Format("2006-01-02")] = count
	}

	return map[string]any{
		"total_articles": total,
		"by_category":    byCategory,
		"by_day":         byDay,
	}, nil
}
