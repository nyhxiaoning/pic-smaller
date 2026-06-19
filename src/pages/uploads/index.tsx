import { Button, Flex, Modal, Popconfirm, Space, Table, Typography, message } from "antd";
import { useState } from "react";

import { formatSize } from "@/functions";
import { goto } from "@/router";
import { observer } from "mobx-react-lite";
import { uploadState, UploadRecord } from "@/states/upload";

const Uploads = observer(() => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UploadRecord | null>(null);

  const handleShowUrls = (record: UploadRecord) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success("已复制到剪贴板");
    });
  };

  const handleDelete = (index: number) => {
    uploadState.remove(index);
    message.success("已删除");
  };

  const columns = [
    { title: "文件名", dataIndex: "name", key: "name" },
    { title: "路径", dataIndex: "path", key: "path" },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      render: (val: number) => formatSize(val),
    },
    {
      title: "时间",
      dataIndex: "time",
      key: "time",
      render: (val: number) => new Date(val).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: UploadRecord, index: number) => (
        <Space>
          <Button type="link" onClick={() => handleShowUrls(record)}>
            查看地址
          </Button>
          <Popconfirm
            title="确定删除该记录？"
            onConfirm={() => handleDelete(index)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const urls = selectedRecord
    ? [
        { label: "Download URL", url: selectedRecord.rawUrl },
        { label: "Git URL", url: selectedRecord.gitUrl },
        { label: "HTML URL", url: selectedRecord.webUrl },
      ]
    : [];

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Space align="center" style={{ justifyContent: "space-between" }}>
        <Typography.Title level={4}>上传记录</Typography.Title>
        <Space>
          <Popconfirm
            title="确定清除所有上传记录？"
            onConfirm={() => {
              uploadState.clear();
              message.success("已清除所有记录");
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button danger>清除所有记录</Button>
          </Popconfirm>
          <Button onClick={() => goto("/home")}>返回首页</Button>
        </Space>
      </Space>
      <Table
        rowKey={(r) => `${r.path}-${r.sha ?? ""}`}
        columns={columns as any}
        dataSource={uploadState.records}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title="上传地址"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {urls.map((item) => (
          <Flex key={item.label} vertical style={{ marginBottom: 16 }}>
            <Typography.Text strong>{item.label}</Typography.Text>
            <Flex align="center" gap={8}>
              <Typography.Text
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.url}
              </Typography.Text>
              <Button size="small" onClick={() => handleCopy(item.url)}>
                复制
              </Button>
              <Button
                size="small"
                type="link"
                href={item.url}
                target="_blank"
              >
                打开
              </Button>
            </Flex>
          </Flex>
        ))}
      </Modal>
    </Flex>
  );
});

export default Uploads;
