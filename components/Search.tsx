"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { useDebounce } from "use-debounce";

import { Input } from "./ui/input";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { getFiles } from "@/lib/actions/file.actions";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupabaseFile[]>([]);
  const [open, setOpen] = useState(false);

  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const [debouncedQuery] = useDebounce(query, 300);

  useEffect(() => {
    const fetchFiles = async () => {
      if (debouncedQuery.length === 0) {
        setResults([]);
        setOpen(false);
        // Drop the ?query= filter, but only when one is actually applied - an
        // unconditional push fired a navigation on every mount of every page.
        if (searchQuery) router.push(path);
        return;
      }

      try {
        const files = await getFiles({ types: [], searchText: debouncedQuery });
        setResults(files?.documents ?? []);
      } catch {
        setResults([]);
      }
      setOpen(true);
    };

    fetchFiles();
    // Deliberately keyed on the typed query alone. Re-running on navigation would
    // re-open the results dropdown right after a result was clicked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    if (!searchQuery) setQuery("");
  }, [searchQuery]);

  const handleClickItem = (file: SupabaseFile) => {
    setOpen(false);
    setResults([]);

    router.push(`/${(file.type === "video" || file.type === "audio") ? "media" : file.type + "s"}?query=${query}`);
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <Image src="/assets/icons/search.svg" alt="search" width={24} height={24} />
        <Input value={query} placeholder="Search..." className="search-input" onChange={((e) => setQuery(e.target.value))} />

        {open &&
          <ul className="search-result">
            {results.length > 0 ? (
              results.map((file) =>
                <li key={file.$id} className="flex items-center justify-between" onClick={() => handleClickItem(file)}>
                  <div className="flex cursor-pointer items-center gap-4">
                    <Thumbnail type={file.type} extension={file.extension} url={file.url} className="size-9 min-w-9" />
                    <p className="subtitle-2 line-clamp-1 text-light-100">{file.name}</p>
                  </div>
                  <FormattedDateTime date={file.$createdAt} className="caption line-clamp-1 text-light-200" />
                </li>
              )
            ) : (
              <p className="empty-result">No files found</p>
            )}
          </ul>
        }
      </div>
    </div>
  );
};

export default Search;