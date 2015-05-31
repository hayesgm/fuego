defmodule Fuego.PageController do
  use Fuego.Web, :controller

  def home(conn, _params) do
    render conn, "home.html"
  end

end
