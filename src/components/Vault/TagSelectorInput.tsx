import React, { useState, useRef, useEffect } from 'react';
import { X, Tag as TagIcon, Check } from 'lucide-react';
import { Tag } from '../../types.ts';
import { POD_COLOR_PALETTE, getTagColor, setTagColor } from '../../lib/podUtils.ts';

interface TagSelectorInputProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  availableTags?: { name: string; color: string }[];
}

export const TagSelectorInput: React.FC<TagSelectorInputProps> = ({
  value = [],
  onChange,
  availableTags = [],
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close color picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setColorPickerTag(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter available tags for autocomplete
  const currentTagNames = new Set(value.map(t => t.name.toLowerCase()));
  const matchingSuggestions = availableTags.filter(t => {
    const lower = t.name.toLowerCase();
    if (currentTagNames.has(lower)) return false;
    if (!inputValue.trim()) return false;
    return lower.includes(inputValue.trim().toLowerCase());
  });

  const addTag = (name: string, explicitColor?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (currentTagNames.has(lower)) {
      setInputValue('');
      return;
    }

    const color = explicitColor || getTagColor(trimmed);
    const updated = [...value, { name: trimmed, color }];
    onChange(updated);
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    if (colorPickerTag === value[indexToRemove]?.name) {
      setColorPickerTag(null);
    }
  };

  const updateTagColor = (tagName: string, newColor: string) => {
    setTagColor(tagName, newColor);
    const updated = value.map(t => {
      if (t.name.toLowerCase() === tagName.toLowerCase()) {
        return { ...t, color: newColor };
      }
      return t;
    });
    onChange(updated);
    setColorPickerTag(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (matchingSuggestions.length > 0 && inputValue.trim()) {
        // If exact or best match
        addTag(matchingSuggestions[0].name, matchingSuggestions[0].color);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex flex-wrap items-center gap-1.5 min-h-[44px] px-3 py-1.5 bg-theme-surface border rounded-xl transition-all ${
          isFocused ? 'border-[#e4048a] ring-1 ring-[#e4048a]/30' : 'border-theme-subtle'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <TagIcon className="w-4 h-4 text-theme-muted mr-1 shrink-0" />

        {value.map((tag, idx) => {
          const tagColor = tag.color || getTagColor(tag.name);
          const isPickerOpen = colorPickerTag === tag.name;

          return (
            <div key={`${tag.name}-${idx}`} className="relative inline-flex items-center">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shadow-sm"
                style={{
                  backgroundColor: `${tagColor}18`,
                  borderColor: `${tagColor}40`,
                  color: tagColor,
                }}
              >
                <button
                  type="button"
                  title="Change tag color"
                  onClick={(e) => {
                    e.stopPropagation();
                    setColorPickerTag(isPickerOpen ? null : tag.name);
                  }}
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20 hover:scale-125 transition-transform"
                  style={{ backgroundColor: tagColor }}
                />
                <span className="truncate max-w-[120px]">{tag.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(idx);
                  }}
                  className="hover:opacity-75 focus:outline-none ml-0.5"
                  aria-label={`Remove tag ${tag.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>

              {/* Color Picker Dropdown */}
              {isPickerOpen && (
                <div
                  className="absolute left-0 top-full mt-1.5 z-50 p-2.5 bg-theme-surface border border-theme-subtle rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {POD_COLOR_PALETTE.map((paletteColor) => {
                    const isSelected = paletteColor.toLowerCase() === tagColor.toLowerCase();
                    return (
                      <button
                        key={paletteColor}
                        type="button"
                        onClick={() => updateTagColor(tag.name, paletteColor)}
                        className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-115 relative"
                        style={{ backgroundColor: paletteColor }}
                        title={paletteColor}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.replace(/,/g, ''))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Add tags (e.g. finance, prod)..." : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-theme-main placeholder-theme-muted/50 focus:outline-none py-1"
        />
      </div>

      {/* Autocomplete Suggestions */}
      {isFocused && matchingSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto bg-theme-surface border border-theme-subtle rounded-xl shadow-xl p-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-theme-muted px-2 py-1">
            Existing Vault Tags
          </div>
          {matchingSuggestions.map((suggestion) => (
            <button
              key={suggestion.name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(suggestion.name, suggestion.color);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-theme-main hover:bg-theme-subtle/30 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: suggestion.color }}
                />
                <span className="font-medium">{suggestion.name}</span>
              </div>
              <span className="text-[10px] text-theme-muted font-mono">Select</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
