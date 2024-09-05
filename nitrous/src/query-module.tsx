import { useState, useEffect } from "react";
import { Form, ActionPanel, Action, showToast, Toast, Clipboard } from "@raycast/api";
import { Nitrous } from "./utils/nitrous.util"; // Updated utility import
import * as fs from "fs";
import * as path from "path";
import os from "os"; // To get the user's downloads folder

export default function QueryModule() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Initialize with an empty string
  const [modules, setModules] = useState<string[]>([]); // Holds the modules for the selected category
  const [selectedModule, setSelectedModule] = useState<string>(""); // Holds the selected module
  const [query, setQuery] = useState<string>(""); // Holds the user input for the query
  const [results, setResults] = useState<any>(null); // Holds the query results

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await Nitrous.fetchCategories(); // Fetch categories
        setCategories(fetchedCategories);
      } catch (error: any) {
        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: "Failed to load categories",
        });
      }
    };

    fetchCategories();
  }, []);

  // Fetch modules when a category is selected
  useEffect(() => {
    if (selectedCategory) {
      const fetchModules = async () => {
        try {
          const categoryModules = await Nitrous.getModulesByCategory(selectedCategory);

          // Ensure we always set an array, even if categoryModules is undefined or an unexpected value
          setModules(Array.isArray(categoryModules) ? categoryModules : []);
        } catch (error: any) {
          showToast({
            style: Toast.Style.Failure,
            title: "Error",
            message: "Failed to load modules for the selected category",
          });
        }
      };

      fetchModules();
    }
  }, [selectedCategory]);

  // Function to handle the query submission
  const handleQuerySubmit = async () => {
    if (!selectedCategory || !selectedModule || !query) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Please fill out all fields before submitting",
      });
      return;
    }

    try {
      const response = await Nitrous.queryModule(selectedCategory, selectedModule, query);

      // Only use the data if status is 200
      if (response.status === 200) {
        const responseData = response.data;

        // Set results to show in the form
        setResults(responseData);

        // Copy results to clipboard
        await Clipboard.copy(JSON.stringify(responseData, null, 2));

        // Show success toast for copying
        showToast({
          style: Toast.Style.Success,
          title: "Query Successful",
          message: "Results copied to clipboard",
        });
      } else {
        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: "Query failed with status: " + response.status,
        });
      }
    } catch (error: any) {
      showToast({
        style: Toast.Style.Failure,
        title: "Query Failed",
        message: error.message,
      });
    }
  };

  // Function to handle saving the results to a file
  const handleSaveResults = async () => {
    if (results) {
      try {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        
        const downloadsPath = path.join(os.homedir(), "Downloads");
        const filePath = path.join(downloadsPath, `${query}-${timestamp}.json`);

        fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

        showToast({
          style: Toast.Style.Success,
          title: "Results Saved",
          message: `Results saved to Downloads`,
        });
      } catch (error: any) {
        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: "Failed to save results",
        });
      }
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Submit Query" onAction={handleQuerySubmit} />
          {results && <Action title="Save Results to Downloads" onAction={handleSaveResults} />}
        </ActionPanel>
      }
    >
      {/* Category Dropdown */}
      <Form.Dropdown
        id="category"
        title="Category"
        value={selectedCategory}
        onChange={setSelectedCategory}
      >
        {categories.map((category) => (
          <Form.Dropdown.Item key={category} value={category} title={category} />
        ))}
      </Form.Dropdown>

      {/* Module Dropdown */}
      <Form.Dropdown
        id="module"
        title="Module"
        value={selectedModule}
        onChange={setSelectedModule}
        storeValue
      >
        {modules.map((mod) => (
          <Form.Dropdown.Item key={mod} value={mod} title={mod} />
        ))}
      </Form.Dropdown>

      {/* Query Input */}
      <Form.TextField
        id="query"
        title="Query"
        placeholder="Enter query string"
        value={query}
        onChange={setQuery}
      />

      {/* Display query results if available */}
      {results && (
        <Form.Description
          title="Query Results"
          text={`\`\`\`\n${JSON.stringify(results, null, 2)}\n\`\`\``} // Pretty-print the results in code block style
        />
      )}
    </Form>
  );
}

// path: src/query-module.tsx