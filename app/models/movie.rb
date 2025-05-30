# app/models/movie.rb
class Movie < ApplicationRecord
  has_many :bookmarks, dependent: :destroy

  validates :title, presence: true
  validates :overview, presence: true
  validates :imdb_id, presence: true, uniqueness: true

  # Méthode pour trouver ou créer par imdb_id
  def self.find_or_create_by_omdb(movie_params)
    find_or_create_by(imdb_id: movie_params[:imdb_id]) do |movie|
      movie.assign_attributes(movie_params.except(:imdb_id))
    end
  end
end
