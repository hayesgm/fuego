defmodule Fuego.PageControllerTest do
  use Fuego.ConnCase

  test "GET /" do
    conn = get conn(), "/"
    html_response(conn, 302)
  end
end
