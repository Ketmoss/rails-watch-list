class BookmarksController < ApplicationController

  def index
    @bookmarks = Bookmark.all
  end

  def show
    @bookmark = Bookmark.find(params[:id])
  end

  def new
    @bookmark = Bookmark.new
    @list = List.find(params[:list_id])
    @movies = Movie.all
  end

  def create
    @bookmark = Bookmark.new(bookmark_params)
    @movies = Movie.all

    # Pour les routes imbriquées, récupérer list_id depuis l'URL
    if params[:list_id]
      @bookmark.list_id = params[:list_id]
      @list = List.find(params[:list_id])
    end

    if @bookmark.save
      redirect_to list_path(@bookmark.list), notice: 'Bookmark was successfully created.'
    else
      # Assurer que @list est défini pour la vue
      @list ||= List.find(@bookmark.list_id) if @bookmark.list_id
      @list ||= List.find(params[:list_id]) if params[:list_id]

      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @bookmark = Bookmark.find(params[:id])
  end

  def update
    @bookmark = Bookmark.find(params[:id])
    @bookmark.update(bookmark_params)
    redirect_to list_path(@bookmark.list), notice: "Bookmark mis à jour."
  end

  def destroy
  @bookmark = Bookmark.find(params[:id])
  @bookmark.destroy
  redirect_to list_path(@bookmark.list), notice: "Bookmark supprimé."
  end

  private

  def bookmark_params
    params.require(:bookmark).permit(:comment, :movie_id, :list_id)
  end
end
