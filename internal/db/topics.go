package db

import (
	"context"
	"fmt"
	"time"

	"github.com/NguyenIslandBoy/daily-news/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

func GetTopics(pool *pgxpool.Pool) ([]models.Topic, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id, name, keywords, created_at FROM topics`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topics []models.Topic
	for rows.Next() {
		var t models.Topic
		if err := rows.Scan(&t.ID, &t.Name, &t.Keywords, &t.CreatedAt); err != nil {
			return nil, err
		}
		topics = append(topics, t)
	}
	return topics, rows.Err()
}

func CreateTopic(pool *pgxpool.Pool, name string, keywords []string) (*models.Topic, error) {
	var t models.Topic
	err := pool.QueryRow(context.Background(),
		`INSERT INTO topics (name, keywords)
		 VALUES ($1, $2)
		 RETURNING id, name, keywords, created_at`,
		name, keywords,
	).Scan(&t.ID, &t.Name, &t.Keywords, &t.CreatedAt)
	return &t, err
}

func UpdateTopic(pool *pgxpool.Pool, id int, name string, keywords []string) (*models.Topic, error) {
	var t models.Topic
	err := pool.QueryRow(context.Background(),
		`UPDATE topics SET name = $1, keywords = $2
		 WHERE id = $3
		 RETURNING id, name, keywords, created_at`,
		name, keywords, id,
	).Scan(&t.ID, &t.Name, &t.Keywords, &t.CreatedAt)
	return &t, err
}

func DeleteTopic(pool *pgxpool.Pool, id int) error {
	tag, err := pool.Exec(context.Background(),
		`DELETE FROM topics WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("topic not found")
	}
	return nil
}

func GetTopicWithCount(pool *pgxpool.Pool) ([]map[string]any, error) {
	rows, err := pool.Query(context.Background(), `
		SELECT t.id, t.name, t.keywords, t.created_at, count(a.id) as article_count
		FROM topics t
		LEFT JOIN articles a ON a.topic_id = t.id
		GROUP BY t.id
		ORDER BY t.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]any
	for rows.Next() {
		var id int
		var name string
		var keywords []string
		var createdAt time.Time
		var count int
		if err := rows.Scan(&id, &name, &keywords, &createdAt, &count); err != nil {
			return nil, err
		}
		result = append(result, map[string]any{
			"id":            id,
			"name":          name,
			"keywords":      keywords,
			"created_at":    createdAt,
			"article_count": count,
		})
	}
	return result, rows.Err()
}
