package api

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/NguyenIslandBoy/daily-news/internal/db"
	"github.com/NguyenIslandBoy/daily-news/internal/models"
	"github.com/NguyenIslandBoy/daily-news/internal/summarizer"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ArticlesHandler struct {
	pool       *pgxpool.Pool
	groqAPIKey string
}

func NewArticlesHandler(pool *pgxpool.Pool, groqAPIKey string) *ArticlesHandler {
	return &ArticlesHandler{pool: pool, groqAPIKey: groqAPIKey}
}

func (h *ArticlesHandler) List(c *gin.Context) {
	filter := db.ArticleFilter{}

	if v := c.Query("topic"); v != "" {
		id, err := strconv.Atoi(v)
		if err == nil {
			filter.TopicID = &id
		}
	}
	if v := c.Query("source"); v != "" {
		id, err := strconv.Atoi(v)
		if err == nil {
			filter.SourceID = &id
		}
	}
	if v := c.Query("q"); v != "" {
		filter.Search = v
	}
	if v := c.Query("from"); v != "" {
		if t, err := time.Parse(time.DateOnly, v); err == nil {
			filter.From = &t
		}
	}
	if v := c.Query("to"); v != "" {
		if t, err := time.Parse(time.DateOnly, v); err == nil {
			filter.To = &t
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	filter.Page = page
	filter.Limit = limit

	articles, total, err := db.GetArticles(h.pool, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch articles"})
		return
	}

	pages := total / filter.Limit
	if total%filter.Limit != 0 {
		pages++
	}

	c.JSON(http.StatusOK, gin.H{
		"articles": articles,
		"total":    total,
		"page":     filter.Page,
		"pages":    pages,
	})
}

func (h *ArticlesHandler) Get(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid article id"})
		return
	}

	article, err := db.GetArticleByID(h.pool, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}

	related, err := db.GetRelatedArticles(h.pool, id)
	if err != nil {
		related = []models.Article{} // non-fatal
	}
	if related == nil {
		related = []models.Article{}
	}

	c.JSON(http.StatusOK, gin.H{
		"article": article,
		"related": related,
	})
}

func (h *ArticlesHandler) Summarize(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid article id"})
		return
	}

	article, err := db.GetArticleByID(h.pool, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	summary, err := summarizer.FetchAndSummarize(ctx, article.URL, article.Summary, h.groqAPIKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("summarization failed: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}
