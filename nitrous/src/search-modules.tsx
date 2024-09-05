import { useEffect, useState } from "react";
import { List, ActionPanel, Action, showToast, Toast, Icon } from "@raycast/api";

import { Nitrous } from "./utils/nitrous.util"; 

interface Endpoint {
  name: string;
  description: string;
  route: string;
  type: string;
}

interface OSINTModule {
  category: string;
  endpoints: Endpoint[];
}

export default function SearchModules() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [modules, setModules] = useState<OSINTModule[]>([]);
  const [filteredModules, setFilteredModules] = useState<OSINTModule[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await Nitrous.getModules();
        setModules(response.data);
        setFilteredModules(response.data);
      } catch (error: any) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load data",
          message: error.message || "Check your internet connection or try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = modules
        .map((module) => ({
          ...module,
          endpoints: module.endpoints.filter((endpoint) =>
            endpoint.name.toLowerCase().includes(searchText.toLowerCase()) ||
            endpoint.description.toLowerCase().includes(searchText.toLowerCase())
          ),
        }))
        .filter((module) => module.endpoints.length > 0);

      setFilteredModules(filtered);
    } else {
      setFilteredModules(modules);
    }
  }, [searchText, modules]);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search OSINT modules..."
      onSearchTextChange={setSearchText}
      throttle
    >
      {filteredModules.map((module) => (
        <List.Section key={module.category} title={module.category}>
          {module.endpoints.map((endpoint) => (
            <List.Item
              key={endpoint.name}
              title={endpoint.name}
              subtitle={endpoint.description}
              accessories={[{ text: endpoint.type }]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={`https://osint.nitrous-oxi.de${endpoint.route}`} title="Open Module" />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
      {!isLoading && filteredModules.length === 0 && (
        <List.EmptyView title="No results found" icon={Icon.MagnifyingGlass} />
      )}
    </List>
  );
}

// path: src/search-modules.tsx