import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onImageSelect(selectedImage);
      setSelectedImage(null);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (selectedImage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <div className="relative">
          <img
            src={selectedImage}
            alt="选中的图片"
            className="w-full h-48 object-cover rounded-xl"
          />
          <button
            onClick={handleCancel}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCancel}
            className="flex-1 btn-secondary py-2"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 btn-primary py-2"
          >
            确认上传
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary hover:bg-primary/5'
        }`}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            dragOver ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}>
            {dragOver ? <Upload className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {dragOver ? '释放以上传图片' : '点击或拖拽图片到此处'}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              支持 JPG、PNG、WEBP 格式，最大 10MB
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </motion.div>
  );
};

export default ImageUploader;
