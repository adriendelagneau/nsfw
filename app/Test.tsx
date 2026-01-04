import React from "react";

const Test = () => {
  return (
    <div>
      <form method="POST" encType="multipart/form-data" action="/api/nsfw">
        <input type="file" name="image" />
        <button type="submit">Test</button>
      </form>
    </div>
  );
};

export default Test;
