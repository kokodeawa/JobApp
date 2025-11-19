import React from 'react';
import { AVATARS } from '../assets/avatars';

interface AvatarProps {
  avatarId: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ avatarId, className }) => {
  // Ensure avatarId is a valid index, default to 0 if not.
  const avatarIndex = parseInt(avatarId, 10);
  const isValidIndex = !isNaN(avatarIndex) && avatarIndex >= 0 && avatarIndex < AVATARS.length;
  const svgString = AVATARS[isValidIndex ? avatarIndex : 0];

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgString }}
      aria-label="User Avatar"
      role="img"
    />
  );
};
