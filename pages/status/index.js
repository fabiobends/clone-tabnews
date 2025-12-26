import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = response.json();
  return responseBody;
}

export default function StagePage() {
  return (
    <>
      <h1>Status Page</h1>
      <UpdatedAt />
      <DatabaseStatus />
    </>
  );
}

function UpdatedAt() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAt = "Loading...";

  if (!isLoading && data) {
    updatedAt = new Date(data.updated_at).toLocaleString("pt-BR");
  }
  return <div>Last updated at: {updatedAt}</div>;
}

function DatabaseStatus() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  const database = data?.dependencies?.database || {};

  return (
    <div>
      <h1>Depedencies: {!isLoading && !data ? "Loading..." : null}</h1>
      {Object.entries(database).map(([name, value]) => (
        <div key={name} style={{ display: "flex", gap: "8px" }}>
          {name}: {value}
        </div>
      ))}
    </div>
  );
}
