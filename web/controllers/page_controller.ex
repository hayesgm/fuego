defmodule Fuego.PageController do
  use Fuego.Web, :controller

  plug :action

  def index(conn, _params) do
    redirect conn, to: page_path(conn, :home)
  end

  def home(conn, _params) do
    render conn, "home2.html"
  end

end
