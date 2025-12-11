import {
  Button,
  Input,
  InputNumber,
  Modal,
  Space,
  Typography,
  message,
} from "antd";

import { homeState } from "@/states/home";
import { observer } from "mobx-react-lite";
import { useState } from "react";

export const BatchRenameDialog = observer(() => {
  const [open, setOpen] = useState(false);
  const [base, setBase] = useState("image");
  const [start, setStart] = useState<number>(1);

  const onOpen = () => setOpen(true);
  const onSubmit = () => {
    const name = base.trim();
    const idx = Number.isFinite(start) ? start : 1;
    if (!name) {
      message.warning("请输入基础名");
      return;
    }
    homeState.batchRenameByPattern(name, idx);
    setOpen(false);
    message.success("已批量重命名");
  };

  return (
    <>
      <Space>
        {/* <Typography.Text type="secondary">批量重命名</Typography.Text> */}
        <Button onClick={onOpen}>重命名</Button>
      </Space>
      <Modal
        title="重命名"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        okText="应用"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            基础名（不含扩展名）
          </Typography.Text>
          <Input
            placeholder="例如：holiday"
            value={base}
            onChange={(e) => setBase(e.target.value)}
          />
          <Typography.Text type="secondary">起始序号</Typography.Text>
          <InputNumber
            min={1}
            value={start}
            onChange={(v) => setStart(Number(v) || 1)}
          />
          <Typography.Text type="secondary">
            文件扩展名保持每张图片原有扩展名
          </Typography.Text>
        </Space>
      </Modal>
    </>
  );
});
