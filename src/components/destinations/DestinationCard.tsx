import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Camera } from 'lucide-react';
import { Destination } from '../../contexts/ChatContext';

interface DestinationCardProps {
  destination: Destination;
  compact?: boolean;
}

const DestinationCard: React.FC<DestinationCardProps> = ({ destination, compact = false }) => {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-3 rounded-xl flex items-center space-x-3"
      >
        <img
          src={destination.images[0]}
          alt={destination.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-neutral-900 dark:text-white truncate">
            {destination.name}
          </h4>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {destination.rating}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card overflow-hidden rounded-2xl"
    >
      {/* Image Carousel */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={destination.images[0]}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Rating Badge */}
        <div className="absolute top-3 right-3 glass-light px-2 py-1 rounded-lg flex items-center space-x-1">
          <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
          <span className="text-xs text-white font-medium">{destination.rating}</span>
        </div>
        
        {/* Image Count */}
        {destination.images.length > 1 && (
          <div className="absolute bottom-3 right-3 glass-light px-2 py-1 rounded-lg flex items-center space-x-1">
            <Camera className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">{destination.images.length}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {destination.name}
          </h3>
        </div>
        
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
          {destination.description}
        </p>
        
        <div className="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-400">
          <MapPin className="w-4 h-4" />
          <span>查看地图</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DestinationCard;
