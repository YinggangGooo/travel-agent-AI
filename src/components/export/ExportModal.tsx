import React, { useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, FileText, Image, FileType, X } from 'lucide-react';
import { Chat } from '../../contexts/ChatContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat | null;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, chat }) => {
  const [exportType, setExportType] = useState<'pdf' | 'image' | 'text'>('pdf');
  const [exportScope, setExportScope] = useState<'current' | 'selected'>('current');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !chat) return null;

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 7;
      const maxLineWidth = pageWidth - 2 * margin;
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(chat.title, margin, margin + 10);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(`创建时间: ${chat.createdAt.toLocaleDateString()}`, margin, margin + 20);
      pdf.text(`更新时间: ${chat.updatedAt.toLocaleDateString()}`, margin, margin + 27);
      
      let yPosition = margin + 40;
      
      // Add messages
      for (const message of chat.messages) {
        // Add message timestamp
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(message.timestamp.toLocaleString(), margin, yPosition);
        yPosition += lineHeight;
        
        // Add sender
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0);
        pdf.text(message.type === 'user' ? '用户:' : 'AI助手:', margin, yPosition);
        yPosition += lineHeight;
        
        // Add message content
        pdf.setFont('helvetica', 'normal');
        const contentLines = pdf.splitTextToSize(message.content, maxLineWidth - 20);
        
        for (const line of contentLines) {
          if (yPosition > pageHeight - margin - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin + 10, yPosition);
          yPosition += lineHeight;
        }
        
        // Add weather data if present
        if (message.weather) {
          if (yPosition > pageHeight - margin - 40) {
            pdf.addPage();
            yPosition = margin;
          }
          yPosition += lineHeight;
          pdf.setFont('helvetica', 'bold');
          pdf.text(`天气信息:`, margin, yPosition);
          yPosition += lineHeight;
          pdf.setFont('helvetica', 'normal');
          pdf.text(`地点: ${message.weather.location}`, margin + 10, yPosition);
          yPosition += lineHeight;
          pdf.text(`温度: ${message.weather.temperature}°C`, margin + 10, yPosition);
          yPosition += lineHeight;
          pdf.text(`天气: ${message.weather.condition}`, margin + 10, yPosition);
        }
        
        yPosition += lineHeight;
      }
      
      // Save the PDF
      pdf.save(`${chat.title}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('生成PDF时出错，请重试');
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const exportAsImage = async () => {
    setIsExporting(true);
    try {
      // Create a temporary element for export
      const exportElement = document.createElement('div');
      exportElement.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 800px;
        padding: 40px;
        background: white;
        font-family: Inter, sans-serif;
        color: #1F2937;
      `;
      
      let content = `
        <div style="margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${chat.title}</h1>
          <p style="font-size: 12px; color: #6B7280;">创建时间: ${chat.createdAt.toLocaleDateString()}</p>
          <p style="font-size: 12px; color: #6B7280;">更新时间: ${chat.updatedAt.toLocaleDateString()}</p>
        </div>
      `;
      
      for (const message of chat.messages) {
        const messageStyle = message.type === 'user' 
          ? 'background: #3B82F6; color: white; padding: 12px; border-radius: 12px; margin-left: 20px; margin-bottom: 12px;'
          : 'background: #F3F4F6; color: #1F2937; padding: 12px; border-radius: 12px; margin-right: 20px; margin-bottom: 12px;';
        
        content += `
          <div style="${messageStyle}">
            <p style="font-size: 10px; opacity: 0.7; margin-bottom: 4px;">${message.timestamp.toLocaleString()}</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">${message.content}</p>
          </div>
        `;
        
        if (message.weather) {
          content += `
            <div style="background: #E0F2FE; border: 1px solid #B3E5FC; border-radius: 8px; padding: 12px; margin-bottom: 12px; margin-left: 20px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${message.weather.location} 天气</h4>
              <p style="margin: 0; font-size: 12px;">温度: ${message.weather.temperature}°C</p>
              <p style="margin: 0; font-size: 12px;">天气: ${message.weather.condition}</p>
            </div>
          `;
        }
      }
      
      exportElement.innerHTML = content;
      document.body.appendChild(exportElement);
      
      // Convert to image
      const canvas = await html2canvas(exportElement, {
        backgroundColor: 'white',
        scale: 2,
        useCORS: true,
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${chat.title}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      // Clean up
      document.body.removeChild(exportElement);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('生成图片时出错，请重试');
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const exportAsText = () => {
    setIsExporting(true);
    try {
      let content = `对话标题: ${chat.title}\n`;
      content += `创建时间: ${chat.createdAt.toLocaleString()}\n`;
      content += `更新时间: ${chat.updatedAt.toLocaleString()}\n\n`;
      content += `='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='='\n\n`;
      
      for (const message of chat.messages) {
        content += `[${message.timestamp.toLocaleString()}] ${message.type === 'user' ? '用户' : 'AI助手'}:\n`;
        content += `${message.content}\n\n`;
        
        if (message.weather) {
          content += `天气信息:\n`;
          content += `  地点: ${message.weather.location}\n`;
          content += `  温度: ${message.weather.temperature}°C\n`;
          content += `  天气: ${message.weather.condition}\n`;
          content += `  湿度: ${message.weather.humidity}%\n`;
          content += `  风速: ${message.weather.windSpeed} km/h\n\n`;
        }
        
        if (message.destinations && message.destinations.length > 0) {
          content += `推荐目的地:\n`;
          message.destinations.forEach((dest, index) => {
            content += `  ${index + 1}. ${dest.name} (评分: ${dest.rating})\n`;
            content += `     ${dest.description}\n`;
          });
          content += '\n';
        }
        
        content += `-'`.repeat(50) + '\n\n';
      }
      
      // Download text file
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chat.title}_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating text file:', error);
      alert('生成文本文件时出错，请重试');
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const handleExport = () => {
    switch (exportType) {
      case 'pdf':
        exportAsPDF();
        break;
      case 'image':
        exportAsImage();
        break;
      case 'text':
        exportAsText();
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative glass-card-strong p-6 rounded-2xl max-w-md w-full mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            导出对话
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg glass-light border border-white/20 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              导出格式
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'pdf', label: 'PDF', icon: FileText },
                { id: 'image', label: '图片', icon: Image },
                { id: 'text', label: '文本', icon: FileType },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setExportType(id as any)}
                  className={`flex flex-col items-center space-y-2 p-3 rounded-lg border-2 transition-colors ${
                    exportType === id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Scope */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              导出范围
            </label>
            <div className="space-y-2">
              {[
                { id: 'current', label: '当前对话' },
                { id: 'selected', label: '选中消息' },
              ].map(({ id, label }) => (
                <label key={id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    value={id}
                    checked={exportScope === id}
                    onChange={(e) => setExportScope(e.target.value as any)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary py-2"
              disabled={isExporting}
            >
              取消
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 btn-primary py-2 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? '导出中...' : '导出'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportModal;
