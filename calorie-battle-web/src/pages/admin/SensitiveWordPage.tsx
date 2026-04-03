import React, { useState, useCallback } from 'react';
import {
  Typography,
  Tag,
  Input,
  Popconfirm,
  Button,
  Space,
  Empty,
  Spin,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';

const { Title } = Typography;

interface SensitiveWordItem {
  id: number;
  word: string;
}

const SensitiveWordPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sensitive-words'],
    queryFn: () => adminApi.getSensitiveWords(),
  });

  const words: SensitiveWordItem[] = data?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (word: string) => adminApi.addSensitiveWord(word),
    onSuccess: () => {
      message.success('敏感词添加成功');
      setInputValue('');
      queryClient.invalidateQueries({ queryKey: ['admin-sensitive-words'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '添加失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteSensitiveWord(id),
    onSuccess: () => {
      message.success('敏感词已删除');
      queryClient.invalidateQueries({ queryKey: ['admin-sensitive-words'] });
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败');
    },
  });

  const handleAdd = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      // 检查是否已存在
      if (words.some((w) => w.word === trimmed)) {
        message.warning('该敏感词已存在');
        return;
      }
      addMutation.mutate(trimmed);
    },
    [words, addMutation],
  );

  const handleSearch = useCallback(
    (value: string) => {
      handleAdd(value);
    },
    [handleAdd],
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>敏感词管理</Title>
      </div>

      {/* 添加敏感词 */}
      <div style={{ marginBottom: 24 }}>
        <Input.Search
          placeholder="输入敏感词后按回车或点击搜索添加"
          enterButton={
            <Button type="primary" icon={<PlusOutlined />} loading={addMutation.isPending}>
              添加
            </Button>
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 480 }}
          allowClear
        />
      </div>

      {/* 敏感词列表 */}
      <Spin spinning={isLoading}>
        {words.length === 0 && !isLoading ? (
          <Empty description="暂无敏感词" />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {words.map((item) => (
              <Popconfirm
                key={item.id}
                title="确认删除"
                description={`确定要删除敏感词「${item.word}」吗？`}
                onConfirm={() => deleteMutation.mutate(item.id)}
                okText="确定"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Tag
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    deleteMutation.mutate(item.id);
                  }}
                  style={{
                    fontSize: 14,
                    padding: '4px 12px',
                    cursor: 'pointer',
                    marginBottom: 4,
                  }}
                  color="red"
                >
                  {item.word}
                </Tag>
              </Popconfirm>
            ))}
          </div>
        )}
      </Spin>

      {words.length > 0 && (
        <div style={{ marginTop: 16, color: '#999' }}>
          共 {words.length} 个敏感词
        </div>
      )}
    </div>
  );
};

export default SensitiveWordPage;
