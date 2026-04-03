import React, { useState } from 'react';
import { Upload, Modal, Image } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

interface ImageUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  maxCount?: number;
  maxSize?: number; // MB
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxCount = 9,
  maxSize = 5,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>(
    value.map((file, index) => ({
      uid: `${index}-${file.name}`,
      name: file.name,
      status: 'done' as const,
      originFileObj: file as any,
      url: URL.createObjectURL(file),
    }))
  );

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    const files = newFileList
      .filter((f) => f.originFileObj)
      .map((f) => f.originFileObj as File);
    onChange?.(files);
  };

  const beforeUpload = (file: File) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
    if (!isValidType) {
      Modal.error({ title: '错误', content: '只能上传 JPG/PNG/JPEG 格式的图片' });
      return Upload.LIST_IGNORE;
    }
    const isValidSize = file.size / 1024 / 1024 < maxSize;
    if (!isValidSize) {
      Modal.error({ title: '错误', content: `图片大小不能超过 ${maxSize}MB` });
      return Upload.LIST_IGNORE;
    }
    return false; // 阻止自动上传，仅保留本地文件
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  return (
    <>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        accept=".jpg,.jpeg,.png"
        maxCount={maxCount}
        multiple
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </Upload>
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <Image
          alt="预览"
          style={{ width: '100%' }}
          src={previewImage}
          preview={false}
        />
      </Modal>
    </>
  );
};

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default ImageUpload;
