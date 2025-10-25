import { useState, useCallback } from 'react';

interface UseMapSyncProps {
  onMarkerClick?: (id: string) => void;
  onRowClick?: (id: string) => void;
}

export const useMapSync = ({ onMarkerClick, onRowClick }: UseMapSyncProps = {}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Handle marker hover
  const handleMarkerHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  // Handle row hover
  const handleRowHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  // Handle marker click - scroll to row
  const handleMarkerClick = useCallback((id: string) => {
    const row = document.getElementById(`recipient-row-${id}`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Flash highlight effect
      row.classList.add('bg-blue-100');
      setTimeout(() => {
        row.classList.remove('bg-blue-100');
      }, 2000);
    }
    
    onMarkerClick?.(id);
  }, [onMarkerClick]);

  // Handle row click - could center map on marker (future enhancement)
  const handleRowClick = useCallback((id: string) => {
    onRowClick?.(id);
  }, [onRowClick]);

  return {
    hoveredId,
    handleMarkerHover,
    handleRowHover,
    handleMarkerClick,
    handleRowClick,
  };
};
