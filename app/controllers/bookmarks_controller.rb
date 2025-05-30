# app/controllers/bookmarks_controller.rb
class BookmarksController < ApplicationController
  before_action :set_list
  before_action :set_bookmark, only: [:show, :destroy]

  def create
    @movie = Movie.find(bookmark_params[:movie_id])
    @bookmark = @list.bookmarks.build(bookmark_params)

    respond_to do |format|
      if @bookmark.save
        format.html { redirect_to @list, notice: 'Film ajouté avec succès!' }
        format.json { render json: @bookmark, status: :created }
      else
        format.html { redirect_to @list, alert: @bookmark.errors.full_messages.join(', ') }
        format.json { render json: { errors: @bookmark.errors.full_messages }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @bookmark.destroy
    respond_to do |format|
      format.html { redirect_to @list, notice: 'Film retiré de la liste!' }
      format.json { head :no_content }
    end
  end

  private

  def set_list
    @list = List.find(params[:list_id])
  end

  def set_bookmark
    @bookmark = @list.bookmarks.find(params[:id])
  end

  def bookmark_params
    params.require(:bookmark).permit(:movie_id, :comment)
  end
end
