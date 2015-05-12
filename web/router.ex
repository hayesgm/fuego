defmodule Fuego.Router do
  use Fuego.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", Fuego do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index

    post "/🔥", NoteController, :create
    get "/🔥", NoteController, :new
    get "/🔥/:tkn", NoteController, :show
  end

  # Other scopes may use custom stacks.
  # scope "/api", Fuego do
  #   pipe_through :api
  # end
end
