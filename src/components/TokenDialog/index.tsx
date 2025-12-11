import { Button, Input, Modal, Space, message } from "antd";

import { gstate } from "@/global";
import { observer } from "mobx-react-lite";
import { useState } from "react";

export const TokenDialog = observer(() => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const onOpen = () => {
    setValue("");
    setOpen(true);
  };

  const onSubmit = () => {
    const v = value.trim();
    if (!v) {
      message.warning("请输入 GitHub Token");
      return;
    }
    gstate.githubToken = v;
    setOpen(false);
    message.success("Token 已更新");
  };

  const onClear = () => {
    gstate.githubToken = "";
    setOpen(false);
    message.success("Token 已清空");
  };

  return (
    <>
      <Space>
        {/* <Typography.Text type="secondary">GitHub Token</Typography.Text> */}
        <Button onClick={onOpen}>
          {gstate.githubToken ? "已设置，点击更新" : "设置 Token"}
        </Button>
      </Space>
      <Modal
        title="设置 GitHub Token"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        okText="保存"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.Password
            placeholder="请输入 GitHub Token"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button type="link" onClick={onClear}>
            清空当前 Token
          </Button>
        </Space>
      </Modal>
    </>
  );
});
