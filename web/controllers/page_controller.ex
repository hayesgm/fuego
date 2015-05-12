defmodule Fuego.PageController do
  use Fuego.Web, :controller

  plug :action

  def index(conn, _params) do
    redirect conn, to: note_path(conn, :new)
  end

end
