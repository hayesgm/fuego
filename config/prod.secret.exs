use Mix.Config

# In this file, we keep production configuration that
# you likely want to automate and keep it away from
# your version control system.
config :fuego, Fuego.Endpoint,
  secret_key_base: System.get_env("SECRET_KEY_BASE")

# Configure your database
config :fuego, Fuego.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: {:system, "DATABASE_URL"}

case System.get_env("CASSANDRA_NODES") do
  nodes when is_bitstring(nodes) ->
    config :cqerl,
      cassandra_nodes: Enum.map(String.split(nodes, ","), fn ip -> {String.to_atom(ip), 9042} end),
      keyspace: "fuego_prod"
  _ -> Mix.shell.error("Failed to load Cassandra: no CASSANDRA_NODES specified...")
end
