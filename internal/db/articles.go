package db

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"
	"time"

	"github.com/NguyenIslandBoy/daily-news/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

func URLHash(url string) string {
	h := sha256.Sum256([]byte(url))
	return fmt.Sprintf("%x", h)
}

// InsertArticle inserts an article, skipping duplicates.
// Returns true if the article was newly inserted, false if it already existed.
func InsertArticle(pool *pgxpool.Pool, a models.Article) (int, error) {
	var id int
	err := pool.QueryRow(context.Background(),
		`INSERT INTO articles
			(url, url_hash, title, summary, author, published_at, source_id, topic_id, category, image_url)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 ON CONFLICT (url) DO NOTHING
		 RETURNING id`,
		a.URL, URLHash(a.URL), a.Title, a.Summary, a.Author,
		a.PublishedAt, a.SourceID, a.TopicID, a.Category, a.ImageURL,
	).Scan(&id)
	if err != nil {
		// ON CONFLICT DO NOTHING returns no rows — not a real error
		if err.Error() == "no rows in result set" {
			return 0, nil
		}
		return 0, err
	}
	return id, nil
}

// WarmSeenSet loads url_hashes from the last 24h into memory.
// Called once on startup to survive restarts without re-inserting known articles.
func WarmSeenSet(pool *pgxpool.Pool) (map[string]struct{}, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT url_hash FROM articles WHERE scraped_at > now() - interval '24h'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	seen := make(map[string]struct{})
	for rows.Next() {
		var hash string
		if err := rows.Scan(&hash); err != nil {
			return nil, err
		}
		seen[hash] = struct{}{}
	}
	return seen, rows.Err()
}

type ArticleFilter struct {
	TopicID  *int
	SourceID *int
	Search   string
	From     *time.Time
	To       *time.Time
	Page     int
	Limit    int
}

func GetArticles(pool *pgxpool.Pool, f ArticleFilter) ([]models.Article, int, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 || f.Limit > 50 {
		f.Limit = 20
	}
	offset := (f.Page - 1) * f.Limit

	args := []any{}
	where := []string{"1=1"}
	i := 1

	if f.TopicID != nil {
		where = append(where, fmt.Sprintf("a.topic_id = $%d", i))
		args = append(args, *f.TopicID)
		i++
	}
	if f.SourceID != nil {
		where = append(where, fmt.Sprintf("a.source_id = $%d", i))
		args = append(args, *f.SourceID)
		i++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("a.search_vector @@ plainto_tsquery('english', $%d)", i))
		args = append(args, f.Search)
		i++
	}
	if f.From != nil {
		where = append(where, fmt.Sprintf("a.published_at >= $%d", i))
		args = append(args, *f.From)
		i++
	}
	if f.To != nil {
		where = append(where, fmt.Sprintf("a.published_at <= $%d", i))
		args = append(args, *f.To)
		i++
	}

	whereClause := strings.Join(where, " AND ")

	// Total count
	var total int
	countQuery := fmt.Sprintf(`
		SELECT count(*) FROM articles a WHERE %s`, whereClause)
	if err := pool.QueryRow(context.Background(), countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Paginated results
	args = append(args, f.Limit, offset)
	query := fmt.Sprintf(`
		SELECT a.id, a.url, a.title, a.summary, a.author,
		       a.published_at, a.scraped_at, a.source_id, a.topic_id,
		       a.category, a.image_url, COALESCE(s.name, '') as source_name
		FROM articles a
		LEFT JOIN sources s ON s.id = a.source_id
		WHERE %s
		ORDER BY a.published_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, i, i+1)

	rows, err := pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var articles []models.Article
	for rows.Next() {
		var a models.Article
		if err := rows.Scan(
			&a.ID, &a.URL, &a.Title, &a.Summary, &a.Author,
			&a.PublishedAt, &a.ScrapedAt, &a.SourceID, &a.TopicID,
			&a.Category, &a.ImageURL, &a.SourceName,
		); err != nil {
			return nil, 0, err
		}
		articles = append(articles, a)
	}
	return articles, total, rows.Err()
}

func GetArticleByID(pool *pgxpool.Pool, id int) (*models.Article, error) {
	var a models.Article
	err := pool.QueryRow(context.Background(), `
		SELECT a.id, a.url, a.title, a.summary, a.author,
		       a.published_at, a.scraped_at, a.source_id, a.topic_id,
		       a.category, a.image_url, COALESCE(s.name, '') as source_name
		FROM articles a
		LEFT JOIN sources s ON s.id = a.source_id
		WHERE a.id = $1`, id).Scan(
		&a.ID, &a.URL, &a.Title, &a.Summary, &a.Author,
		&a.PublishedAt, &a.ScrapedAt, &a.SourceID, &a.TopicID,
		&a.Category, &a.ImageURL, &a.SourceName,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}
