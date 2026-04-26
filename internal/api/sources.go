package api

import (
	"net/http"

	"github.com/NguyenIslandBoy/daily-news/internal/db"
	"github.com/NguyenIslandBoy/daily-news/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SourcesHandler struct {
	pool *pgxpool.Pool
}

func NewSourcesHandler(pool *pgxpool.Pool) *SourcesHandler {
	return &SourcesHandler{pool: pool}
}

func (h *SourcesHandler) List(c *gin.Context) {
	sources, err := db.GetSources(h.pool)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch sources"})
		return
	}
	if sources == nil {
		sources = []models.Source{}
	}
	c.JSON(http.StatusOK, gin.H{"sources": sources})
}
