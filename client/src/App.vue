<template>
  <div class="container">
    <h1>Google OAuth2.0 認証デモ</h1>

    <!-- 未ログイン時 -->
    <div v-if="!user">
      <button @click="loginWithGoogle">Googleでログイン</button>
    </div>
    
    <!-- ログイン済み時 -->
    <div v-else>
      <h2>プロフィール情報</h2>
      <p><strong>名前：</strong>{{ user.name }}</p>
      <p><strong>メール：</strong>{{ user.email }}</p>
      <!-- 画像をブロック要素にして中央寄せ -->
      <img :src="user.picture" alt="ユーザー画像" />
      <!-- ログアウトボタンもブロック要素にし、改行して中央寄せ -->
      <button @click="logout" class="logout">ログアウト</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import axios from 'axios';

export default defineComponent({
  name: 'App',
  setup() {
    const user = ref<any>(null);

    // Google認証開始
    const loginWithGoogle = () => {
      window.location.href = 'http://localhost:3000/auth/google';
    };

    // プロフィール取得
    const fetchUserProfile = async () => {
      try {
        const res = await axios.get('http://localhost:3000/profile', {
          withCredentials: true
        });
        user.value = res.data;
      } catch (error) {
        console.error('プロフィール取得エラー:', error);
      }
    };

    // ログアウト
    const logout = () => {
      window.location.href = 'http://localhost:3000/logout';
    };

    // ページ読み込み時にプロフィール取得
    onMounted(() => {
      fetchUserProfile();
    });

    return {
      user,
      loginWithGoogle,
      logout,
    };
  },
});
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 2rem auto;
  text-align: center;
}

/* ボタンの共通スタイル */
button {
  padding: 0.5rem 1rem;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1rem;
}

/* 画像をブロック要素として扱い、中央寄せ */
img {
  max-width: 150px;
  border-radius: 50%;
  margin-top: 1rem;
  display: block; 
  margin-left: auto;
  margin-right: auto;
}

/* ログアウトボタンを改行+中央寄せしたい場合 */
.logout {
  display: block;
  margin: 1rem auto 0; /* 上マージンだけ少し広めに */
}
</style>
