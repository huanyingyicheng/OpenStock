export type TermsContent = {
  title: string;
  lastUpdated: string;
  plainEnglishTitle: string;
  plainEnglishBody: string;
  sections: {
    approach: {
      title: string;
      intro: string;
      bullets: Array<{ title: string; body: string }>;
    };
    basics: {
      title: string;
      intro: string;
      bullets: Array<{ title: string; body: string; icon: string }>;
    };
    freeForever: {
      title: string;
      intro: string;
      bullets: string[];
      note: string;
    };
    disclaimer: {
      title: string;
      intro: string;
      paragraphs: Array<{ bold: string; rest: string }>;
    };
    account: {
      title: string;
      intro: string;
      loveTitle: string;
      loveBullets: string[];
      hurtTitle: string;
      hurtBullets: string[];
    };
    data: {
      title: string;
      paragraphs: Array<{ bold: string; rest: string }>;
    };
    availability: {
      title: string;
      intro: string;
      bullets: string[];
    };
    changes: {
      title: string;
      introBold: string;
      bullets: string[];
    };
    questions: {
      title: string;
      intro: string;
      legalLabel: string;
      legalEmail: string;
      discussionLabel: string;
      discussionText: string;
    };
    closing: {
      title: string;
      quote: string;
      thanks: string;
    };
  };
};

export const enTermsContent: TermsContent = {
  title: 'Terms of Service',
  lastUpdated: 'Last updated: October 4, 2025',
  plainEnglishTitle: 'Written in Plain English',
  plainEnglishBody:
    'No legal jargon here. These terms are designed to be fair, understandable, and aligned with our Open Dev Society values.',
  sections: {
    approach: {
      title: '🌟 Our Approach to Terms',
      intro:
        'We believe terms of service should protect both users and creators without being exploitative. These terms reflect the Open Dev Society manifesto: open, fair, community-first.',
      bullets: [
        { title: 'No Gotchas', body: 'What you see is what you get' },
        { title: 'Community Input', body: 'These terms were reviewed by our community' },
        { title: 'Fair Use', body: 'Reasonable limits that protect everyone' },
        { title: 'Always Free Core', body: 'We promise core features stay free forever' },
      ],
    },
    basics: {
      title: '🎯 The Basics',
      intro: "By using OpenStock, you're joining our community. Here's what that means:",
      bullets: [
        { icon: '💙', title: 'Respectful Use', body: 'Use OpenStock to learn, build, and grow — not to harm others' },
        { icon: '🎓', title: 'Educational Focus', body: 'Perfect for students, personal projects, and learning' },
        { icon: '🤝', title: 'Community Spirit', body: 'Help others when you can, ask for help when you need it' },
        { icon: '🔓', title: 'Open Source Values', body: 'Contribute back when possible, share knowledge freely' },
      ],
    },
    freeForever: {
      title: '💰 Our Free Forever Promise',
      intro: 'Core features of OpenStock will always be free:',
      bullets: [
        'Real-time stock data and charts',
        'Personal watchlists and portfolio tracking',
        'Basic market analysis tools',
        'Community features and discussions',
        'API access for personal projects',
      ],
      note:
        'This is not a “freemium trap” — it’s our commitment to making financial tools accessible to everyone.',
    },
    disclaimer: {
      title: '🛡️ Investment Disclaimer (The Important Stuff)',
      intro: "Let's be crystal clear about this:",
      paragraphs: [
        {
          bold: 'OpenStock is an educational and analysis tool, not investment advice.',
          rest: ' We provide data and tools to help you make informed decisions, but the decisions are yours.',
        },
        {
          bold: "We're not financial advisors.",
          rest: " We're developers and community members who built tools we wished existed when we were learning about investing.",
        },
        {
          bold: 'Always do your own research.',
          rest: ' Use multiple sources, consult professionals, and never invest more than you can afford to lose.',
        },
      ],
    },
    account: {
      title: '👥 Your Account & Responsibilities',
      intro: "We trust you to be a good community member. Here's what we ask:",
      loveTitle: "✨ What We'd Love",
      loveBullets: [
        'Share knowledge with other users',
        'Report bugs and suggest improvements',
        'Keep your account information current',
        'Use the platform to learn and grow',
      ],
      hurtTitle: '❌ What Hurts Everyone',
      hurtBullets: [
        'Sharing accounts or API keys',
        'Trying to break or exploit the system',
        'Harassing other community members',
        'Using the platform for illegal activities',
      ],
    },
    data: {
      title: '📊 Data & Content',
      paragraphs: [
        {
          bold: 'Your data belongs to you.',
          rest: " We provide tools to export everything anytime. We'll never claim ownership of your watchlists, notes, or personal information.",
        },
        {
          bold: 'Market data comes from licensed sources.',
          rest: " While we provide it for free, please respect that it's meant for personal use and learning.",
        },
        {
          bold: 'Community contributions are appreciated.',
          rest: " If you share insights or contribute to discussions, you're helping build a knowledge commons for everyone.",
        },
      ],
    },
    availability: {
      title: '🔧 Service Availability',
      intro: "We're committed to keeping OpenStock running, but we're also realistic:",
      bullets: [
        "We aim for 99.9% uptime, but stuff happens (we're human!)",
        "We'll give advance notice for planned maintenance",
        "Major outages will be communicated on our status page and Discord",
        "We're building sustainable infrastructure, not just cheap hosting",
      ],
    },
    changes: {
      title: '🔄 Changes to These Terms',
      introBold: 'We believe in transparency for terms changes too:',
      bullets: [
        'Community discussion on proposed changes',
        "Clear explanation of what's changing and why",
        'Version history available on GitHub',
      ],
    },
    questions: {
      title: '🤔 Questions or Concerns?',
      intro:
        "Legal documents shouldn't be mysterious. If anything here confuses you or seems unfair, let's talk about it.",
      legalLabel: 'Legal Questions',
      legalEmail: 'legal@opendevsociety.org',
      discussionLabel: 'General Discussion',
      discussionText: 'Join our Discord #community channel',
    },
    closing: {
      title: 'The Open Dev Society Way',
      quote:
        '"We build tools that empower people, create knowledge that’s free for all, and foster communities where everyone can grow."',
      thanks: 'These terms reflect those values. Thanks for being part of our community.',
    },
  },
};

export const zhTermsContent: TermsContent = {
  title: '服务条款',
  lastUpdated: '最近更新：2025 年 10 月 4 日',
  plainEnglishTitle: '用通俗语言写成',
  plainEnglishBody:
    '这里没有晦涩的法律术语。这些条款力求公平、易懂，并与 Open Dev Society 的价值观一致。',
  sections: {
    approach: {
      title: '🌟 我们对条款的态度',
      intro:
        '我们认为服务条款应同时保护用户与创作者，而不是以不公平的方式“坑”任何人。本条款体现了 Open Dev Society 的理念：开放、公平、社区优先。',
      bullets: [
        { title: '没有隐藏条款', body: '所见即所得' },
        { title: '社区参与', body: '这些条款经过社区审阅与讨论' },
        { title: '合理使用', body: '设定必要的边界以保护所有人' },
        { title: '核心永远免费', body: '我们承诺核心功能长期保持免费' },
      ],
    },
    basics: {
      title: '🎯 基本规则',
      intro: '使用 OpenStock，意味着你加入了我们的社区。你需要了解：',
      bullets: [
        { icon: '💙', title: '尊重使用', body: '用它来学习、构建与成长，而不是伤害他人' },
        { icon: '🎓', title: '学习导向', body: '适合学生、个人项目与自我学习' },
        { icon: '🤝', title: '社区精神', body: '能帮就帮，遇到问题也欢迎求助' },
        { icon: '🔓', title: '开源价值', body: '有余力就回馈社区，让知识自由流动' },
      ],
    },
    freeForever: {
      title: '💰 永久免费的承诺',
      intro: 'OpenStock 的核心功能将始终免费，包括：',
      bullets: ['实时行情与图表', '个人关注列表与组合追踪', '基础市场分析工具', '社区讨论与功能', '用于个人项目的 API 访问'],
      note: '这不是“免费试用再收费”的套路，而是我们让金融工具人人可用的长期承诺。',
    },
    disclaimer: {
      title: '🛡️ 投资免责声明（重要）',
      intro: '请务必明确以下事项：',
      paragraphs: [
        {
          bold: 'OpenStock 是学习与分析工具，不构成投资建议。',
          rest: ' 我们提供数据与工具帮助你做出更充分的判断，但最终决策由你自己承担。',
        },
        {
          bold: '我们不是持牌金融顾问。',
          rest: ' 我们是开发者与社区成员，做了我们在学习投资时希望拥有的工具。',
        },
        {
          bold: '请始终独立研究（DYOR）。',
          rest: ' 结合多方信息、必要时咨询专业人士，并且不要投入超过你可承受损失的资金。',
        },
      ],
    },
    account: {
      title: '👥 账号与责任',
      intro: '我们相信你会成为友好的社区成员。我们希望你：',
      loveTitle: '✨ 我们鼓励的行为',
      loveBullets: ['与其他用户分享经验与知识', '反馈 Bug 并提出改进建议', '保持账号信息准确', '把平台用于学习与成长'],
      hurtTitle: '❌ 会伤害大家的行为',
      hurtBullets: ['共享账号或 API Key', '尝试攻击/利用系统漏洞', '骚扰其他社区成员', '将平台用于违法活动'],
    },
    data: {
      title: '📊 数据与内容',
      paragraphs: [
        {
          bold: '你的数据属于你自己。',
          rest: ' 我们提供随时导出的能力。我们不会主张拥有你的关注列表、笔记或个人信息。',
        },
        {
          bold: '市场数据来自授权来源。',
          rest: ' 我们尽力免费提供，但也请尊重其使用范围（个人使用与学习为主）。',
        },
        {
          bold: '社区贡献非常宝贵。',
          rest: ' 当你分享观点或参与讨论，你正在帮助大家共同构建一个开放的知识库。',
        },
      ],
    },
    availability: {
      title: '🔧 服务可用性',
      intro: '我们会尽力保持 OpenStock 稳定运行，但也需要现实一点：',
      bullets: ['目标是 99.9% 可用性，但偶尔也会出问题（我们也是人）', '计划性维护会提前通知', '重大故障会在状态页与 Discord 通知', '我们在建设可持续的基础设施，而不是只追求最便宜的托管'],
    },
    changes: {
      title: '🔄 条款变更',
      introBold: '条款变更也应当透明：',
      bullets: ['在变更前进行社区讨论', '清晰说明改了什么、为什么改', '在 GitHub 上保留版本历史'],
    },
    questions: {
      title: '🤔 有疑问或担忧？',
      intro: '法律条款不应该让人摸不着头脑。如果你觉得哪里不清楚或不公平，欢迎沟通。',
      legalLabel: '法律相关',
      legalEmail: 'legal@opendevsociety.org',
      discussionLabel: '一般讨论',
      discussionText: '加入我们的 Discord：#community 频道',
    },
    closing: {
      title: 'Open Dev Society 的方式',
      quote: '“我们打造能赋能每个人的工具，创造对所有人免费的知识，并建设让每个人都能成长的社区。”',
      thanks: '这些条款体现了上述价值观。感谢你成为社区的一员。',
    },
  },
};

