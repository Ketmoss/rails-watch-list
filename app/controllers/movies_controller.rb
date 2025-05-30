# app/controllers/movies_controller.rb
class MoviesController < ApplicationController
  before_action :set_list, only: [:index]

  def index
    @movies = Movie.all
  end

  def create
    @movie = Movie.find_or_create_by(imdb_id: movie_params[:imdb_id]) do |movie|
      movie.assign_attributes(movie_params.except(:imdb_id))
    end

    respond_to do |format|
      if @movie.persisted? || @movie.save
        format.json { render json: @movie }
      else
        format.json { render json: { errors: @movie.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_list
    @list = List.find(params[:list_id]) if params[:list_id]
  end

  def movie_params
    params.require(:movie).permit(:title, :overview, :poster_url, :rating, :imdb_id)
  end
end
