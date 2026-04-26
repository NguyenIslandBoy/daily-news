package api

import (
	"net/http"
	"strconv"

	"github.com/NguyenIslandBoy/daily-news/internal/db"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TopicsHandler struct {
	pool *pgxpool.Pool
}

func NewTopicsHandler(pool *pgxpool.Pool) *TopicsHandler {
	return &TopicsHandler{pool: pool}
}

func (h *TopicsHandler) List(c *gin.Context) {
	topics, err := db.GetTopicWithCount(h.pool)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch topics"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"topics": topics})
}

func (h *TopicsHandler) Create(c *gin.Context) {
	var body struct {
		Name     string   `json:"name"     binding:"required"`
		Keywords []string `json:"keywords" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	topic, err := db.CreateTopic(h.pool, body.Name, body.Keywords)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create topic"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"topic": topic})
}

func (h *TopicsHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid topic id"})
		return
	}

	var body struct {
		Name     string   `json:"name"     binding:"required"`
		Keywords []string `json:"keywords" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	topic, err := db.UpdateTopic(h.pool, id, body.Name, body.Keywords)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update topic"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"topic": topic})
}

func (h *TopicsHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid topic id"})
		return
	}

	if err := db.DeleteTopic(h.pool, id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
