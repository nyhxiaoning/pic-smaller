import { Button, Flex, Space, Table, Typography } from "antd";

import { formatSize } from "@/functions";
import { goto } from "@/router";
import { observer } from "mobx-react-lite";
import { uploadState } from "@/states/upload";

const Uploads = observer(() => {
  const columns = [
    { title: "文件名", dataIndex: "name", key: "name" },
    { title: "路径", dataIndex: "path", key: "path" },
    {
      title: "Raw地址",
      dataIndex: "rawUrl",
      key: "rawUrl",
      render: (value: string) => (
        <Typography.Link href={value} target="_blank">
          {value}
        </Typography.Link>
      ),
    },
    {
      title: "Web地址",
      dataIndex: "webUrl",
      key: "webUrl",
      render: (value: string) => (
        <Typography.Link href={value} target="_blank">
          {value}
        </Typography.Link>
      ),
    },
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
  ];

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Space align="center" style={{ justifyContent: "space-between" }}>
        <Typography.Title level={4}>上传记录</Typography.Title>
        <Button onClick={() => goto("/home")}>返回首页</Button>
      </Space>
      <Table
        rowKey={(r) => `${r.path}-${r.sha ?? ""}`}
        columns={columns as any}
        dataSource={uploadState.records}
        pagination={{ pageSize: 10 }}
      />
    </Flex>
  );
});

export default Uploads;
