import React, { useState, useCallback } from 'react';
import {
  Typography,
  Card,
  Button,
  Radio,
  Space,
  message,
} from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';

const { Title, Text, Paragraph } = Typography;

interface ExportOption {
  type: string;
  label: string;
  description: string;
  filename: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    type: 'checkins',
    label: '打卡记录',
    description: '导出所有用户的打卡记录，包含打卡时间、任务类型、审核状态、获得积分等信息。',
    filename: '打卡记录.xlsx',
  },
  {
    type: 'points',
    label: '积分记录',
    description: '导出所有积分变动记录，包含积分来源、变动数量、变动时间、当前余额等信息。',
    filename: '积分记录.xlsx',
  },
  {
    type: 'redemptions',
    label: '兑换记录',
    description: '导出所有兑换记录，包含兑换用户、兑换商品、消耗积分、兑换码、兑换状态等信息。',
    filename: '兑换记录.xlsx',
  },
  {
    type: 'reviews',
    label: '审核记录',
    description: '导出所有审核记录，包含审核员、审核对象、审核结果、审核时间、审核意见等信息。',
    filename: '审核记录.xlsx',
  },
];

const DataExportPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('checkins');

  const exportMutation = useMutation({
    mutationFn: (type: string) => adminApi.exportData(type),
    onSuccess: (data) => {
      // data 是 ApiResponse<Blob>，实际 blob 在 data.data 中
      const blob = data?.data;
      if (!blob) {
        message.error('导出数据为空');
        return;
      }

      const option = EXPORT_OPTIONS.find((o) => o.type === selectedType);
      const filename = option?.filename || `${selectedType}.xlsx`;

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('导出成功');
    },
    onError: (err: Error) => {
      message.error(err.message || '导出失败');
    },
  });

  const handleExport = useCallback(() => {
    exportMutation.mutate(selectedType);
  }, [selectedType, exportMutation]);

  const selectedOption = EXPORT_OPTIONS.find((o) => o.type === selectedType);

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>数据导出</Title>
      </div>

      <Card>
        <Radio.Group
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {EXPORT_OPTIONS.map((option) => (
              <Radio key={option.type} value={option.type} style={{ width: '100%' }}>
                <Card
                  size="small"
                  style={{
                    width: '100%',
                    borderColor: selectedType === option.type ? '#1677ff' : undefined,
                    backgroundColor: selectedType === option.type ? '#f0f5ff' : undefined,
                  }}
                  hoverable
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 15 }}>
                      <FileExcelOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      {option.label}
                    </Text>
                    <Paragraph
                      type="secondary"
                      style={{ margin: 0, fontSize: 13 }}
                    >
                      {option.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportMutation.isPending}
          >
            导出 {selectedOption?.label ?? ''} 数据
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DataExportPage;
