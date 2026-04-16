import AnimalTask from './tasks/AnimalTask';
import SPSTask from './tasks/SPSTask';
import XOTask from './tasks/XOTask';
import { type JSX } from 'react';
import UploadTask from './tasks/UploadTask';
import SimonSaysTask from './tasks/SimonSaysTask';
interface TYPEStasksManager {
  isTaskOpen: boolean;
  taskID: string;
  onClose: () => void;
}

export default function TaskManager({
  isTaskOpen,
  taskID,
  onClose,
}: TYPEStasksManager) {
  const TaskComp: Record<string, JSX.Element> = {
    cardTask: <AnimalTask onClose={onClose} taskID={taskID} />,
    eleTask: <XOTask onClose={onClose} taskID={taskID} />,
    reactorTask: <SPSTask onClose={onClose} taskID={taskID} />,
    navTask: <SimonSaysTask onClose={onClose} taskID={taskID} />,
    chairTask: <UploadTask onClose={onClose} taskID={taskID} />,
  };
  if (!isTaskOpen) return null;
  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm py-20 ">
      <div onClick={onClose} className="absolute inset-0 z-0" />
      {TaskComp[taskID] || (
        <div className="text-white text-2xl font-bold">
          Task "{taskID}" not found!
        </div>
      )}
    </div>
  );
}
