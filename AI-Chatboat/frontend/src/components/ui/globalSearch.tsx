import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// Define TypeScript interfaces
interface User {
  _id: string;
  name: string;
  email: string;
}

interface Deal {
  _id: string;
  title: string;
}

interface Suggestion {
  path: string;
  page: string;
}

interface SearchResults {
  users: User[];
  deals: Deal[];
  suggestions: Suggestion[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ users: [], deals: [], suggestions: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);

    try {
      const { data } = await axios.get<SearchResults>(`http://localhost:8000/api/v1/search?q=${query}`);
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Search..."
        className="border p-2 rounded w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
      />

      {loading && <p>Loading...</p>}

      <div className="mt-4">
        {results.users.length > 0 && (
          <div>
            <h3 className="font-bold">Users</h3>
            <ul>
              {results.users.map((user: User) => (
                <li key={user._id}>{user.name} - {user.email}</li>
              ))}
            </ul>
          </div>
        )}

        {results.deals.length > 0 && (
          <div>
            <h3 className="font-bold">Deals</h3>
            <ul>
              {results.deals.map((deal: Deal) => (
                <li key={deal._id}>{deal.title}</li>
              ))}
            </ul>
          </div>
        )}

        {results.suggestions.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold">Found in:</h3>
            <ul>
              {results.suggestions.map((suggestion: Suggestion, index: number) => (
                <li key={index} className="cursor-pointer text-blue-500" onClick={() => router.push(suggestion.path)}>
                  {suggestion.page} Page
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
