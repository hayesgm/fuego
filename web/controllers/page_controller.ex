defmodule Fuego.PageController do
  use Fuego.Web, :controller

  plug :action

  def index(conn, _params) do
    render conn, "index.html"
  end
end
