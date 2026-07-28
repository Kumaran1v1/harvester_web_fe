import React, { useState } from "react";
import {
  FormControl, InputLabel, Select, MenuItem, TextField,
  Box, ListSubheader
} from "@mui/material";
import { Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: string[] | Option[];
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
  size?: "small" | "medium";
  disabled?: boolean;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label, value, options, onChange, required, error, size = "small", disabled, placeholder
}) => {
  const [search, setSearch] = useState("");

  // Normalise to Option[]
  const normalised: Option[] = (options as any[]).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );

  const filtered = normalised.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FormControl fullWidth size={size} required={required} error={error} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        onClose={() => setSearch("")}
        MenuProps={{ autoFocus: false, PaperProps: { sx: { maxHeight: 320 } } }}
      >
        <ListSubheader sx={{ p: 0, bgcolor: "background.paper" }}>
          <TextField
            size="small"
            autoFocus
            placeholder="Search..."
            fullWidth
            value={search}
            onChange={(e) => { e.stopPropagation(); setSearch(e.target.value); }}
            onKeyDown={(e) => e.stopPropagation()}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ mr: 1, display: "flex", alignItems: "center", color: "text.secondary" }}>
                  <Search size={14} />
                </Box>
              ),
            }}
            sx={{ px: 1, pt: 1, pb: 0.5 }}
          />
        </ListSubheader>
        <MenuItem value=""><em>{placeholder || "-- Select --"}</em></MenuItem>
        {filtered.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
        {filtered.length === 0 && (
          <MenuItem disabled>No results found</MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default SearchableSelect;
