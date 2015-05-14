defmodule Fuego.PageControllerTest do
  use Fuego.ConnCase

  test "GET /" do
    conn = get conn(), "/"
    html_response(conn, 302)
  end

  test "GET /" do
    conn = get conn(), "/🔥"
    assert html_response(conn, 200) =~ "justHGH2"
  end
end
