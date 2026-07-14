const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                <div className={\`flex flex-col \${isMe ? 'items-end' : 'items-start'}\`}>
                  <div className={\`flex items-center gap-2 mb-1 sm:mb-1.5 px-1 w-full \${isMe ? 'justify-end' : 'justify-between'}\`}>
                    <span className="text-xs text-slate-500 font-medium">
                      {msg.sender}
                    </span>
                    {isMe && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>`;

const replacement = `                {isMe && (
                  <button 
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="hidden md:flex p-1.5 rounded-full bg-slate-200 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete message"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className={\`flex flex-col \${isMe ? 'items-end' : 'items-start'}\`}>
                  <div className="flex items-center gap-2 mb-1 sm:mb-1.5 px-1 w-full justify-end">
                    <span className="text-xs text-slate-500 font-medium">
                      {msg.sender}
                    </span>
                  </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content);
  console.log("REPLACED!");
} else {
  console.log("NOT FOUND!");
}
