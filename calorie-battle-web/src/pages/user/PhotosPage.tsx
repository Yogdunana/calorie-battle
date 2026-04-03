import React, { useState, useCallback } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Tabs,
  Button,
  Space,
  Upload,
  Modal,
  Form,
  Input,
  Image,
  Empty,
  Spin,
  message,
  List,
  Tag,
  Alert,
} from 'antd';
import {
  CameraOutlined,
  LikeOutlined,
  LikeFilled,
  PlusOutlined,
  UserOutlined,
  TrophyOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photoApi } from '@/services/photoApi';
import { formatDateTime } from '@/utils/format';
import { UPLOAD_BASE_URL } from '@/utils/constants';
import useAuthStore from '@/app/store/authStore';
import type { PhotoWork } from '@/types/user.types';
import type { UploadFile } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PhotosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  // 获取作品列表
  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ['photoWorks', page, pageSize],
    queryFn: () => photoApi.getPhotos({ page, pageSize }),
  });

  // 获取我的投稿（通过筛选当前用户的作品）
  const { data: myPhotosData, isLoading: myPhotosLoading } = useQuery({
    queryKey: ['myPhotoWorks'],
    queryFn: () => photoApi.getPhotos({ page: 1, pageSize: 100 }),
    select: (data) => {
      const allPhotos = data.data?.list ?? [];
      return allPhotos.filter((p) => p.user_id === user?.id);
    },
  });

  // 投票操作
  const voteMutation = useMutation({
    mutationFn: (photoId: number) => photoApi.vote(photoId),
    onSuccess: () => {
      message.success('投票成功！');
      queryClient.invalidateQueries({ queryKey: ['photoWorks'] });
      queryClient.invalidateQueries({ queryKey: ['myPhotoWorks'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '投票失败，请稍后重试');
    },
  });

  // 投稿操作
  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await photoApi.submit(formData);
      return res.data;
    },
    onSuccess: () => {
      message.success('投稿成功，请等待审核');
      setSubmitOpen(false);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['photoWorks'] });
      queryClient.invalidateQueries({ queryKey: ['myPhotoWorks'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '投稿失败，请稍后重试');
    },
  });

  const photos = photosData?.data?.list ?? [];
  const pagination = photosData?.data?.pagination;
  const myPhotos = myPhotosData ?? [];

  // 图片预览
  const handlePreview = useCallback((url: string) => {
    setPreviewImage(url);
    setPreviewOpen(true);
  }, []);

  // 上传前校验
  const beforeUpload = useCallback((file: File) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type);
    if (!isValidType) {
      message.error('只能上传 JPG/PNG/JPEG/WEBP 格式的图片');
      return Upload.LIST_IGNORE;
    }
    const isValidSize = file.size / 1024 / 1024 < 10;
    if (!isValidSize) {
      message.error('图片大小不能超过 10MB');
      return Upload.LIST_IGNORE;
    }
    return false; // 阻止自动上传
  }, []);

  // 提交投稿
  const handleSubmitWork = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (fileList.length === 0) {
        message.warning('请上传作品图片');
        return;
      }

      const file = fileList[0].originFileObj;
      if (!file) {
        message.warning('请上传作品图片');
        return;
      }

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('image', file);

      submitMutation.mutate(formData);
    } catch {
      // 表单校验失败
    }
  }, [form, fileList, submitMutation]);

  // 投票
  const handleVote = useCallback(
    (photo: PhotoWork) => {
      if (photo.has_voted) {
        message.info('您已为该作品投过票了');
        return;
      }

      Modal.confirm({
        title: '确认投票',
        content: `确定要为「${photo.title || '该作品'}」投票吗？每人每日可投3票，不可重复投给同一作品。`,
        okText: '确认投票',
        cancelText: '取消',
        onOk: () => voteMutation.mutate(photo.id),
      });
    },
    [voteMutation]
  );

  // 渲染作品卡片
  const renderPhotoCard = (photo: PhotoWork) => {
    const imageUrl = photo.image_url?.startsWith('http')
      ? photo.image_url
      : `${UPLOAD_BASE_URL}${photo.image_url}`;

    return (
      <Col key={photo.id} xs={24} sm={12} md={8} lg={6}>
        <Card
          hoverable
          style={{ borderRadius: 12, height: '100%', overflow: 'hidden' }}
          styles={{ body: { padding: 0 } }}
          cover={
            <div
              style={{
                height: 200,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => handlePreview(imageUrl)}
            >
              <img
                src={imageUrl}
                alt={photo.title || '健身掠影'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYmZiZmJmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
          }
        >
          <div style={{ padding: '12px 16px' }}>
            <Title level={5} ellipsis style={{ marginBottom: 4 }}>
              {photo.title || '未命名作品'}
            </Title>
            <Space style={{ marginBottom: 8 }}>
              <UserOutlined style={{ fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {photo.user?.username || '匿名用户'}
              </Text>
            </Space>
            {photo.description && (
              <Paragraph
                type="secondary"
                style={{ fontSize: 12, marginBottom: 8 }}
                ellipsis={{ rows: 2 }}
              >
                {photo.description}
              </Paragraph>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={4}>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <Text strong style={{ fontSize: 14 }}>
                  {photo.vote_count}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  票
                </Text>
              </Space>
              <Button
                type={photo.has_voted ? 'default' : 'primary'}
                size="small"
                icon={photo.has_voted ? <LikeFilled /> : <LikeOutlined />}
                disabled={photo.has_voted || voteMutation.isPending}
                loading={voteMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote(photo);
                }}
              >
                {photo.has_voted ? '已投票' : '投票'}
              </Button>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  // 作品展示
  const renderGallery = () => {
    if (photosLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (photos.length === 0) {
      return <Empty description="暂无作品" />;
    }

    return (
      <>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message="投票规则"
          description="每位用户每日可投3票，不可重复投给同一作品。快来为你喜欢的健身掠影投票吧！"
        />
        <Row gutter={[16, 16]}>
          {photos.map((photo) => renderPhotoCard(photo))}
        </Row>
        {pagination && pagination.totalPages > 1 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Space>
              <Button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                上一页
              </Button>
              <Text type="secondary">
                第 {page} / {pagination.totalPages} 页
              </Text>
              <Button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </Space>
          </div>
        )}
      </>
    );
  };

  // 我的投稿
  const renderMyWorks = () => {
    if (myPhotosLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (myPhotos.length === 0) {
      return (
        <Empty description="暂无投稿记录">
          <Button type="primary" onClick={() => setSubmitOpen(true)}>
            立即投稿
          </Button>
        </Empty>
      );
    }

    return (
      <List
        dataSource={myPhotos}
        renderItem={(photo) => {
          const imageUrl = photo.image_url?.startsWith('http')
            ? photo.image_url
            : `${UPLOAD_BASE_URL}${photo.image_url}`;

          const statusMap: Record<string, { label: string; color: string }> = {
            pending: { label: '待审核', color: 'blue' },
            approved: { label: '已通过', color: 'green' },
            rejected: { label: '已驳回', color: 'red' },
          };
          const statusConfig = statusMap[photo.status] || statusMap.pending;

          return (
            <List.Item>
              <Card
                size="small"
                style={{ borderRadius: 8, width: '100%' }}
              >
                <Row gutter={16} align="middle">
                  <Col xs={6} sm={4}>
                    <Image
                      src={imageUrl}
                      alt={photo.title}
                      style={{
                        width: '100%',
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 6,
                      }}
                      preview={false}
                      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2JmYmZiZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPtmbo5zlm57ml6DnvJ88L3RleHQ+PC9zdmc+"
                    />
                  </Col>
                  <Col xs={18} sm={20}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{photo.title || '未命名作品'}</Text>
                        <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
                      </div>
                      {photo.description && (
                        <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }} ellipsis>
                          {photo.description}
                        </Paragraph>
                      )}
                      <Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <TrophyOutlined style={{ color: '#faad14', marginRight: 4 }} />
                          {photo.vote_count} 票
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          投稿时间：{formatDateTime(photo.created_at)}
                        </Text>
                      </Space>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          );
        }}
      />
    );
  };

  // 投稿弹窗
  const renderSubmitModal = () => (
    <Modal
      open={submitOpen}
      title={
        <Space>
          <CameraOutlined />
          投稿作品
        </Space>
      }
      okText="提交投稿"
      cancelText="取消"
      onOk={handleSubmitWork}
      onCancel={() => {
        setSubmitOpen(false);
        form.resetFields();
        setFileList([]);
      }}
      confirmLoading={submitMutation.isPending}
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="作品标题"
          rules={[{ required: true, message: '请输入作品标题' }]}
        >
          <Input placeholder="请输入作品标题" maxLength={50} showCount />
        </Form.Item>
        <Form.Item
          name="description"
          label="作品描述"
        >
          <TextArea
            placeholder="请输入作品描述（选填）"
            rows={3}
            maxLength={200}
            showCount
          />
        </Form.Item>
        <Form.Item
          label="作品图片"
          required
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            onPreview={(file) => {
              if (!file.url && !file.preview) {
                file.preview = getBase64Sync(file.originFileObj as File);
              }
              setPreviewImage(file.url || (file.preview as string));
              setPreviewOpen(true);
            }}
            beforeUpload={beforeUpload}
            accept=".jpg,.jpeg,.png,.webp"
            maxCount={1}
            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
          >
            {fileList.length >= 1 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
          <Text type="secondary" style={{ fontSize: 12 }}>
            支持 JPG/PNG/JPEG/WEBP 格式，不超过 10MB
          </Text>
        </Form.Item>
      </Form>
    </Modal>
  );

  const tabItems = [
    {
      key: 'gallery',
      label: (
        <Space>
          <PictureOutlined />
          作品展示
        </Space>
      ),
      children: renderGallery(),
    },
    {
      key: 'myWorks',
      label: (
        <Space>
          <CameraOutlined />
          我的投稿
        </Space>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setSubmitOpen(true)}
            >
              投稿作品
            </Button>
          </div>
          {renderMyWorks()}
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>健身掠影</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setSubmitOpen(true)}
        >
          投稿作品
        </Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Tabs items={tabItems} />
      </Card>

      {/* 投稿弹窗 */}
      {renderSubmitModal()}

      {/* 图片预览弹窗 */}
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="预览" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

function getBase64Sync(file: File): string {
  // Synchronous placeholder - actual base64 conversion is async but we use it for preview URL
  return URL.createObjectURL(file);
}

export default PhotosPage;
