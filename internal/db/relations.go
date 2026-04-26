package db

import (
	"context"
	"fmt"

	"github.com/NguyenIslandBoy/daily-news/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

// FindCandidateIDs returns IDs of articles related to the given article
// by same author, same source+topic, or full-text overlap.
func FindCandidateIDs(pool *pgxpool.Pool, a models.Article) ([]int, error) {
	args := []any{}
	i := 1

	// Base condition — never relate to itself
	conditions := ""

	// same author
	authorClause := ""
	if a.Author != "" {
		authorClause = "OR (author = $" + itoa(i) + " AND author != '')"
		args = append(args, a.Author)
		i++
	}

	// same source + same topic
	sourceTopicClause := ""
	if a.SourceID != nil && a.TopicID != nil {
		sourceTopicClause = "OR (source_id = $" + itoa(i) + " AND topic_id = $" + itoa(i+1) + ")"
		args = append(args, *a.SourceID, *a.TopicID)
		i += 2
	}

	// full-text overlap using title
	ftsClause := ""
	if a.Title != "" {
		ftsClause = "OR search_vector @@ plainto_tsquery('english', $" + itoa(i) + ")"
		args = append(args, a.Title)
		i++
	}

	conditions = authorClause + " " + sourceTopicClause + " " + ftsClause

	if conditions == "" {
		return nil, nil
	}

	// exclude the article itself
	args = append(args, a.ID)
	query := `
		SELECT id FROM articles
		WHERE (false ` + conditions + `)
		AND id != $` + itoa(i) + `
		LIMIT 10`

	rows, err := pool.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func InsertRelations(pool *pgxpool.Pool, articleID int, relatedIDs []int) error {
	for _, relID := range relatedIDs {
		_, err := pool.Exec(context.Background(), `
			INSERT INTO article_relations (article_id, related_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING`,
			articleID, relID,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func GetRelatedArticles(pool *pgxpool.Pool, articleID int) ([]models.Article, error) {
	rows, err := pool.Query(context.Background(), `
		SELECT a.id, a.url, a.title, a.summary, a.author,
		       a.published_at, a.scraped_at, a.source_id, a.topic_id,
		       a.category, a.image_url, COALESCE(s.name, '') as source_name
		FROM articles a
		LEFT JOIN sources s ON s.id = a.source_id
		WHERE a.id IN (
			SELECT related_id FROM article_relations WHERE article_id = $1
			UNION
			SELECT article_id FROM article_relations WHERE related_id = $1
		)
		LIMIT 5`, articleID)
	if err != nil {
		return nil, err
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
			return nil, err
		}
		articles = append(articles, a)
	}
	return articles, rows.Err()
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}
